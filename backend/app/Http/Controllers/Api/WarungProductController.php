<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WarungProduct;
use Illuminate\Http\Request;

class WarungProductController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(Request $request)
    {
        $query = WarungProduct::query()
            ->with(['category:id,name', 'warung:id,name,created_by_clerk_id']);

        if ($request->filled('warung_id')) {
            $query->where('warung_id', $request->input('warung_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $data = $request->only([
            'warung_id', 'category_id', 'name',
            'estimated_price', 'image_url', 'rating', 'is_estimated',
        ]);

        $data['created_by_clerk_id'] = $clerkId;
        $data['created_at'] = now();

        $product = WarungProduct::query()->create($data);

        return response()->json($product, 201);
    }

    public function update(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $product = WarungProduct::query()->findOrFail($id);

        $data = $request->only([
            'category_id', 'name', 'estimated_price',
            'image_url', 'rating', 'is_estimated',
        ]);

        $product->update($data);

        return response()->json($product);
    }

    public function destroy(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        WarungProduct::query()->findOrFail($id)->delete();

        return response()->json(['message' => 'Product deleted']);
    }
}
