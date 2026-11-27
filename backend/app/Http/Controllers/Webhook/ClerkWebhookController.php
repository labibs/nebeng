<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClerkWebhookController extends Controller
{
    public function store(Request $request)
    {
        $secret = (string) config('services.clerk.webhook_secret');
        $payload = $request->getContent();

        $svixId = $request->header('svix-id');
        $svixTimestamp = $request->header('svix-timestamp');
        $svixSignature = $request->header('svix-signature');

        if (!$svixId || !$svixTimestamp || !$svixSignature) {
            Log::warning('Clerk webhook missing Svix headers');
            return response()->json(['error' => 'Missing Svix headers'], 400);
        }

        if ($secret === '' || !$this->verifySignature($secret, $svixId, $svixTimestamp, $payload, $svixSignature)) {
            Log::warning('Clerk webhook signature verification failed');
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $event = $request->json()->all();
        $type = data_get($event, 'type');
        $data = data_get($event, 'data', []);

        if ($type !== 'user.created') {
            return response()->json(['received' => true, 'ignored' => true]);
        }

        $clerkId = data_get($data, 'id') ?? data_get($data, 'clerk_id');
        $email = data_get($data, 'email_addresses.0.email_address');
        $name = trim((data_get($data, 'first_name', '') . ' ' . data_get($data, 'last_name', '')));
        $avatarUrl = data_get($data, 'image_url');

        User::updateOrCreate(
            ['clerk_id' => (string) $clerkId],
            [
                'role' => 'buyer',
                'email' => $email,
                'name' => $name !== '' ? $name : null,
                'avatar_url' => $avatarUrl,
            ]
        );

        return response()->json(['received' => true]);
    }

    private function verifySignature(string $secret, string $svixId, string $svixTimestamp, string $payload, string $svixSignature): bool
    {
        $encodedSecret = str_starts_with($secret, 'whsec_')
            ? substr($secret, 6)
            : $secret;

        $key = base64_decode($encodedSecret, true);
        if ($key === false) {
            return false;
        }

        $signedContent = $svixId.'.'.$svixTimestamp.'.'.$payload;
        $expected = base64_encode(hash_hmac('sha256', $signedContent, $key, true));

        foreach (explode(' ', $svixSignature) as $signature) {
            $parts = explode(',', $signature, 2);
            if (count($parts) === 2) {
                [, $sig] = $parts;
                if (hash_equals($expected, $sig)) {
                    return true;
                }
            } elseif (hash_equals($expected, $signature)) {
                return true;
            }
        }

        return false;
    }
}
