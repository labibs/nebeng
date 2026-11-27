<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PostLike;
use Illuminate\Http\Request;

class PostLikeController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(Request $request, string $postId)
    {
        $clerkId = $this->clerkId($request);
        $likesCount = PostLike::query()->where('post_id', $postId)->count();
        $userLiked = $clerkId !== ''
            && PostLike::query()->where('post_id', $postId)->where('user_id', $clerkId)->exists();

        return response()->json([
            'likes_count' => $likesCount,
            'user_liked' => $userLiked,
        ]);
    }

    public function toggle(Request $request, string $postId)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $existing = PostLike::query()
            ->where('post_id', $postId)
            ->where('user_id', $clerkId)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json([
                'liked' => false,
                'message' => 'Post unliked',
            ]);
        }

        PostLike::query()->create([
            'post_id' => $postId,
            'user_id' => $clerkId,
            'created_at' => now(),
        ]);

        return response()->json([
            'liked' => true,
            'message' => 'Post liked',
        ]);
    }
}
