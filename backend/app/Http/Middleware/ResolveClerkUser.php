<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveClerkUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $clerkId = (string) (
            $request->header('x-clerk-user-id')
            ?? $request->header('x-user-id')
            ?? $request->input('clerk_id')
            ?? ''
        );

        if ($clerkId === '') {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->attributes->set('clerk_user_id', $clerkId);
        $request->merge(['clerk_id' => $clerkId]);

        return $next($request);
    }
}
