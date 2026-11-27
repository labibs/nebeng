<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;

class PostController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(Request $request)
    {
        $query = Post::query()
            ->with(['user:id,clerk_id,name,avatar_url'])
            ->orderByDesc('created_at');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('from_city', 'like', "%{$search}%")
                    ->orWhere('to_city', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('item_description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('user_id')) {
            $query->where('clerk_user_id', $request->input('user_id'));
        }

        $limit = (int) $request->input('limit', 50);
        $posts = $query->limit($limit)->get();

        return response()->json($posts);
    }

    public function show(string $id)
    {
        $post = Post::query()
            ->with(['user:id,clerk_id,name,avatar_url'])
            ->findOrFail($id);

        return response()->json($post);
    }

    public function store(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $user = User::query()->where('clerk_id', $clerkId)->first();

        $data = $request->only([
            'armada', 'type', 'from_city', 'to_city',
            'from_lat', 'from_lng', 'to_lat', 'to_lng',
            'travel_date', 'item_description', 'item_photo',
            'price', 'fee', 'description', 'status', 'location',
        ]);

        $data['clerk_user_id'] = $clerkId;
        $data['user_id'] = $user?->id;
        $data['created_at'] = now();

        if (isset($data['location']) && is_array($data['location'])) {
            $data['location'] = json_encode($data['location']);
        }

        $post = Post::query()->create($data);

        return response()->json($post, 201);
    }

    public function update(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $post = Post::query()->findOrFail($id);
        abort_if($post->clerk_user_id !== $clerkId, 403, 'Not your post');

        $data = $request->only([
            'armada', 'type', 'from_city', 'to_city',
            'from_lat', 'from_lng', 'to_lat', 'to_lng',
            'travel_date', 'item_description', 'item_photo',
            'price', 'fee', 'description', 'status', 'location',
        ]);

        if (isset($data['location']) && is_array($data['location'])) {
            $data['location'] = json_encode($data['location']);
        }

        $post->update($data);

        return response()->json($post);
    }

    public function destroy(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $post = Post::query()->findOrFail($id);
        abort_if($post->clerk_user_id !== $clerkId, 403, 'Not your post');

        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }
}
