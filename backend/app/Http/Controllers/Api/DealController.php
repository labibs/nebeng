<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\DealLiveLocation;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DealController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function show(string $id)
    {
        $deal = Deal::query()
            ->with([
                'post:id,from_city,to_city,type,item_photo,created_at',
                'carrier:id,clerk_id,name,avatar_url',
                'depositor:id,clerk_id,name,avatar_url',
                'transaction:id,deal_id,transaction_status,payment_status,gross_amount,payment_type,created_at',
                'liveLocation',
            ])
            ->findOrFail($id);

        return response()->json($deal);
    }

    public function update(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $deal = Deal::query()->findOrFail($id);

        $data = $request->only([
            'delivery_status', 'status', 'pickup_datetime',
            'pickup_location', 'delivery_location',
            'item_description', 'item_photos', 'notes',
            'agreed_fee', 'item_fee',
        ]);

        $deal->update($data);

        return response()->json($deal);
    }

    public function updateLiveLocation(Request $request, string $dealId)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $location = DealLiveLocation::query()->updateOrCreate(
            ['deal_id' => $dealId],
            [
                'courier_id' => $clerkId,
                'lat' => $request->input('lat'),
                'lng' => $request->input('lng'),
            ]
        );

        return response()->json($location);
    }

    public function getLiveLocation(string $dealId)
    {
        $location = DealLiveLocation::query()
            ->where('deal_id', $dealId)
            ->first();

        return response()->json($location);
    }

    public function getTransaction(string $dealId)
    {
        $transaction = Transaction::query()
            ->where('deal_id', $dealId)
            ->first();

        return response()->json($transaction);
    }

    public function upsertTransaction(Request $request, string $dealId)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $deal = Deal::query()->findOrFail($dealId);
        abort_if(!in_array($clerkId, [$deal->carrier_id, $deal->depositor_id], true), 403, 'Not allowed');

        $data = $request->only([
            'gross_amount', 'transaction_status', 'payment_status',
            'payment_type', 'payment_gateway', 'snap_token', 'order_id',
            'fraud_status', 'paid_at',
        ]);

        $data['deal_id'] = $deal->id;
        $data['gross_amount'] = $data['gross_amount'] ?? 0;
        $data['transaction_status'] = $data['transaction_status'] ?? 'ready_to_ship';
        $data['payment_status'] = $data['payment_status'] ?? 'pending';
        $data['payment_gateway'] = $data['payment_gateway'] ?? 'midtrans';

        $transaction = Transaction::query()->updateOrCreate(
            ['deal_id' => $deal->id],
            $data
        );

        return response()->json($transaction);
    }

    public function updateTransaction(Request $request, string $transactionId)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $transaction = Transaction::query()->findOrFail($transactionId);

        $data = $request->only([
            'transaction_status', 'payment_status',
        ]);

        $transaction->update($data);

        return response()->json($transaction);
    }
}
