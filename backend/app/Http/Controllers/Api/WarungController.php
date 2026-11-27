<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warung;
use Illuminate\Http\Request;

class WarungController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(Request $request)
    {
        $query = Warung::query()
            ->with(['creator:id,clerk_id,name,avatar_url'])
            ->orderByDesc('created_at');

        if ($request->filled('created_by')) {
            $query->where('created_by_clerk_id', $request->input('created_by'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $limit = (int) $request->input('limit', 50);

        return response()->json($query->limit($limit)->get());
    }

    public function show(string $id)
    {
        $warung = Warung::query()
            ->with(['creator:id,clerk_id,name,avatar_url', 'categories:id,warung_id,name,description,icon'])
            ->findOrFail($id);

        return response()->json($warung);
    }

    public function store(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $data = $request->only([
            'name', 'description', 'latitude', 'longitude',
            'visibility', 'category', 'status', 'image_url',
            'dokumen_url', 'address',
            'from_lat', 'from_lng', 'to_lat', 'to_lng',
        ]);

        $data['created_by_clerk_id'] = $clerkId;
        $data['created_at'] = now();

        $warung = Warung::query()->create($data);

        return response()->json($warung, 201);
    }

    public function update(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $warung = Warung::query()->findOrFail($id);
        abort_if($warung->created_by_clerk_id !== $clerkId, 403, 'Not your warung');

        $data = $request->only([
            'name', 'description', 'latitude', 'longitude',
            'visibility', 'category', 'status', 'image_url',
            'dokumen_url', 'address',
            'from_lat', 'from_lng', 'to_lat', 'to_lng',
        ]);

        $warung->update($data);

        return response()->json($warung);
    }

    public function destroy(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $warung = Warung::query()->findOrFail($id);
        abort_if($warung->created_by_clerk_id !== $clerkId, 403, 'Not your warung');

        $warung->delete();

        return response()->json(['message' => 'Warung deleted']);
    }

    public function count(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $count = Warung::query()
            ->where('created_by_clerk_id', $clerkId)
            ->count();

        return response()->json(['count' => $count]);
    }
}
