<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransferRequest;
use App\Http\Resources\TransferResource;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransferController extends Controller
{
    public function __construct(private WalletService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['per_page' => ['nullable', 'integer', 'between:1,100']]);

        return TransferResource::collection(
            $request->user()->transfers()
                ->with('fromWallet', 'toWallet')
                ->orderByDesc('transfer_date')
                ->orderByDesc('id')
                ->paginate((int) $request->input('per_page', 10))
        );
    }

    public function store(StoreTransferRequest $request): JsonResponse
    {
        $transfer = $this->service->transfer($request->user(), $request->validated());

        return response()->json([
            'message' => __('messages.transfer_created'),
            'data' => new TransferResource($transfer),
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->transfers()->findOrFail($id)->delete();

        return response()->json(['message' => __('messages.transfer_deleted')]);
    }
}
