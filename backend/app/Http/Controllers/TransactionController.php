<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function createSnap(Request $request)
    {
        $validated = $request->validate([
            'transaction_id' => ['required', 'string'],
        ]);

        $trx = Transaction::query()
            ->select('id', 'deal_id', 'gross_amount', 'transaction_status', 'payment_status', 'snap_token', 'order_id')
            ->findOrFail($validated['transaction_id']);

        if (!in_array($trx->payment_status, ['draft', 'pending', 'expired'], true)) {
            return response()->json(['error' => 'Transaksi sudah dibayar atau dibatalkan'], 422);
        }

        if ($trx->snap_token && $trx->payment_status !== 'expired') {
            return response()->json(['snap_token' => $trx->snap_token]);
        }

        $isProduction = (bool) config('services.midtrans.is_production', false);
        $midtransBaseUrl = $isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';

        $serverKey = (string) config('services.midtrans.server_key');
        $authString = base64_encode($serverKey . ':');

        $orderId = $trx->order_id;
        if ($orderId) {
            $statusUrl = sprintf(
                'https://api%s.midtrans.com/v2/%s/status',
                $isProduction ? '' : '.sandbox',
                $orderId
            );

            $statusResponse = Http::withHeaders([
                'Accept' => 'application/json',
                'Authorization' => 'Basic '.$authString,
            ])->get($statusUrl);

            if ($statusResponse->ok()) {
                $existing = $statusResponse->json();
                if (in_array(data_get($existing, 'transaction_status'), ['settlement', 'capture', 'deny'], true)) {
                    return response()->json(['error' => 'Transaksi dengan order_id lama sudah final di Midtrans'], 422);
                }
            }
        }

        $midtransOrderId = 'trx-'.Str::lower(Str::random(20));

        $payload = [
            'transaction_details' => [
                'order_id' => $midtransOrderId,
                'gross_amount' => (float) $trx->gross_amount,
            ],
            'credit_card' => [
                'secure' => true,
            ],
            'item_details' => [
                [
                    'id' => (string) $trx->deal_id ?: 'item-1',
                    'price' => (float) $trx->gross_amount,
                    'quantity' => 1,
                    'name' => 'Transaksi '.$trx->id,
                ],
            ],
            'custom_field1' => 'original_trx_id: '.$trx->id,
            'finish_redirect_url' => rtrim((string) config('app.url'), '/').'/deal?deal='.$trx->deal_id.'&trx='.$trx->id,
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'Authorization' => 'Basic '.$authString,
        ])->post($midtransBaseUrl.'/transactions', $payload);

        if (!$response->successful()) {
            return response()->json([
                'error' => 'Midtrans error: '.$response->status(),
                'details' => $response->body(),
            ], 400);
        }

        $data = $response->json();
        if (empty($data['token'])) {
            return response()->json(['error' => 'Gagal generate snap token dari Midtrans'], 400);
        }

        $trx->update([
            'snap_token' => $data['token'],
            'order_id' => $midtransOrderId,
            'payment_status' => 'pending',
        ]);

        return response()->json(['snap_token' => $data['token']]);
    }
}
