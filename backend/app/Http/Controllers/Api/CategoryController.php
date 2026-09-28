<?php

namespace App\Http\Controllers\Api;

use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'type' => ['nullable', Rule::enum(TransactionType::class)],
            'active' => ['nullable', 'boolean'],
        ]);

        $categories = $request->user()->categories()
            ->withCount('transactions')
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->where('type', $type))
            ->when(isset($filters['active']), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $request->user()->categories()->create($request->validated() + ['is_active' => true]);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => new CategoryResource($category->loadCount('transactions')),
        ], 201);
    }

    public function update(UpdateCategoryRequest $request): JsonResponse
    {
        $category = $request->category();
        $category->update($request->validated());

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => new CategoryResource($category->loadCount('transactions')),
        ]);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $category = $request->user()->categories()->findOrFail($id);
        $category->update(['is_active' => ! $category->is_active]);

        return response()->json([
            'message' => $category->is_active ? 'Kategori diaktifkan.' : 'Kategori dinonaktifkan.',
            'data' => new CategoryResource($category->loadCount('transactions')),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = $request->user()->categories()->withCount('transactions')->findOrFail($id);

        if ($category->transactions_count > 0) {
            throw ValidationException::withMessages([
                'category' => "Kategori masih dipakai {$category->transactions_count} transaksi. Nonaktifkan saja.",
            ]);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }
}
