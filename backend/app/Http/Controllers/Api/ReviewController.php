<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(Request $request)
    {
        $query = Review::query()
            ->with(['user:id,clerk_id,name,avatar_url']);

        if ($request->filled('reviewable_type') && $request->filled('reviewable_id')) {
            $query->where('reviewable_type', $request->input('reviewable_type'))
                ->where('reviewable_id', $request->input('reviewable_id'));
        }

        if ($request->filled('user_clerk_id')) {
            $query->where('user_clerk_id', $request->input('user_clerk_id'));
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $data = $request->only([
            'reviewable_type', 'reviewable_id', 'reviewable_clerk_id',
            'rating', 'comment',
        ]);

        $data['user_clerk_id'] = $clerkId;
        $data['created_at'] = now();

        $review = Review::query()->create($data);

        return response()->json($review, 201);
    }
}
