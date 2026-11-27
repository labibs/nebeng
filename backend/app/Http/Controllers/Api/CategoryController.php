<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->filled('warung_id')) {
            $query->where('warung_id', $request->input('warung_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $data = $request->only(['warung_id', 'name', 'description', 'icon']);
        $data['created_at'] = now();

        $category = Category::query()->create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $category = Category::query()->findOrFail($id);

        $data = $request->only(['name', 'description', 'icon']);
        $category->update($data);

        return response()->json($category);
    }

    public function destroy(Request $request, string $id)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        Category::query()->findOrFail($id)->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
