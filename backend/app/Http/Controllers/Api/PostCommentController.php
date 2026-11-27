<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PostComment;
use Illuminate\Http\Request;

class PostCommentController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(string $postId)
    {
        $comments = PostComment::query()
            ->with(['user:id,clerk_id,name,avatar_url'])
            ->where('post_id', $postId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, string $postId)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $comment = PostComment::query()->create([
            'post_id' => $postId,
            'user_id' => $clerkId,
            'content' => $request->input('content'),
            'created_at' => now(),
        ]);

        return response()->json($comment, 201);
    }

    public function destroy(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $comment = PostComment::query()->findOrFail($id);
        abort_if($comment->user_id !== $clerkId, 403, 'Not your comment');

        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }
}
