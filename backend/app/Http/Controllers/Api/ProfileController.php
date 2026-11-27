<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function show(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $user = User::query()
            ->where('clerk_id', $clerkId)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    public function showByClerkId(string $clerkId)
    {
        $user = User::query()
            ->select('id', 'name', 'avatar_url', 'clerk_id', 'role', 'email', 'created_at')
            ->where('clerk_id', $clerkId)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    public function admins()
    {
        $admins = User::query()
            ->select('id', 'name', 'avatar_url', 'clerk_id')
            ->where('role', 'admin')
            ->get();

        return response()->json($admins);
    }
}
