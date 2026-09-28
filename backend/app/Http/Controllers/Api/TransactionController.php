<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\TransactionIndexRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransactionController extends Controller
{
    public function __construct(private TransactionService $service) {}

    public function index(TransactionIndexRequest $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $period = $request->period();
        $filters = $request->filters();

        return TransactionResource::collection(
            $this->service->paginate($user, $period, $filters, $request->sort(), $request->dir(), $request->perPage())
        )->additional([
            'period' => $period?->toArray(),
            'summary' => $this->service->totals($user, $period, $filters),
        ]);
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $transaction = $this->service->create($request->user(), $request->payload());

        return response()->json([
            'message' => 'Transaksi berhasil ditambahkan.',
            'data' => new TransactionResource($transaction),
        ], 201);
    }

    public function show(Request $request, int $id): TransactionResource
    {
        return new TransactionResource($request->user()->transactions()->with('category')->findOrFail($id));
    }

    public function update(UpdateTransactionRequest $request): JsonResponse
    {
        $transaction = $this->service->update($request->transaction(), $request->payload());

        return response()->json([
            'message' => 'Transaksi berhasil diperbarui.',
            'data' => new TransactionResource($transaction),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->delete($request->user()->transactions()->findOrFail($id));

        return response()->json(['message' => 'Transaksi berhasil dihapus.']);
    }
}
