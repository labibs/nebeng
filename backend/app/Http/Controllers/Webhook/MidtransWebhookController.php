<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function store(Request $request)
    {
        if ($request->method() !== 'POST') {
            return response()->json(['error' => 'Method Not Allowed'], 405);
        }

        try {
            $notification = $request->json()->all();

            $orderId = (string) data_get($notification, 'order_id', '');
            if ($orderId === '') {
                return $this->successResponse();
            }

            $statusCode = (string) data_get($notification, 'status_code', '200');
            $grossAmount = (string) data_get($notification, 'gross_amount', '');
            $signatureKey = (string) data_get($notification, 'signature_key', '');
            $transactionStatus = (string) data_get($notification, 'transaction_status', '');
            $fraudStatus = (string) data_get($notification, 'fraud_status', '');
            $paymentType = data_get($notification, 'payment_type');

            $serverKey = (string) config('services.midtrans.server_key');
            $payloadString = $orderId.$statusCode.$grossAmount.$serverKey;
            $calculatedSignature = hash('sha512', $payloadString);

            if ($signatureKey !== $calculatedSignature) {
                Log::warning('Invalid Midtrans signature', ['order_id' => $orderId]);
                return response()->json(['received' => true], 200);
            }

            $statusMap = [
                'settlement' => 'paid',
                'capture-accept' => 'paid',
                'cancel' => 'cancelled',
                'expire' => 'expired',
                'deny' => 'failed',
                'capture-challenge' => 'fraud_review',
                'capture-deny' => 'failed',
                'pending' => 'pending',
            ];

            $statusKey = $transactionStatus === 'capture'
                ? 'capture-'.($fraudStatus !== '' ? strtolower($fraudStatus) : 'unknown')
                : strtolower($transactionStatus);

            $newTransactionStatus = $statusMap[$statusKey] ?? 'pending';

            $trx = Transaction::query()->where('order_id', $orderId)->first();
            if (!$trx) {
                return $this->successResponse();
            }

            if (in_array($trx->payment_status, ['paid', 'cancelled', 'expired', 'failed'], true)) {
                return $this->successResponse();
            }

            if ($trx->payment_status === $newTransactionStatus) {
                return $this->successResponse();
            }

            $updateData = [
                'payment_status' => $newTransactionStatus,
                'fraud_status' => $fraudStatus !== '' ? $fraudStatus : null,
                'payment_type' => $paymentType,
                'updated_at' => now(),
            ];

            if ($newTransactionStatus === 'paid') {
                $updateData['paid_at'] = now();
            }

            $trx->update($updateData);

            return $this->successResponse();
        } catch (\Throwable $e) {
            Log::error('Midtrans webhook error', ['message' => $e->getMessage()]);
            return $this->successResponse();
        }
    }

    private function successResponse()
    {
        return response()->json(['received' => true]);
    }
}
