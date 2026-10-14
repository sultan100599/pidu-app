<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWalletRequest;
use App\Http\Requests\UpdateWalletRequest;
use App\Http\Resources\WalletResource;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class WalletController extends Controller
{
    public function __construct(private WalletService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->service->primaryFor($request->user());

        // in_use: dompet yang punya catatan tidak bisa dihapus, jadi tombol Hapus tidak ditampilkan.
        $wallets = $this->service->withBalances($request->user())
            ->loadExists(['transactions', 'transfersOut', 'transfersIn', 'recurringTransactions']);

        return WalletResource::collection($wallets);
    }

    public function store(StoreWalletRequest $request): JsonResponse
    {
        $wallet = $request->user()->wallets()->create($request->payload());

        return response()->json([
            'message' => __('messages.wallet_created'),
            'data' => new WalletResource($wallet->refresh()),
        ], 201);
    }

    public function update(UpdateWalletRequest $request): JsonResponse
    {
        $wallet = $request->wallet();
        $wallet->update($request->payload());

        return response()->json([
            'message' => __('messages.wallet_updated'),
            'data' => new WalletResource($wallet),
        ]);
    }

    /**
     * Arsipkan / pakai lagi. Minimal satu dompet harus tetap aktif.
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $wallet = $user->wallets()->findOrFail($id);

        if ($wallet->is_active && ! $user->wallets()->where('is_active', true)->whereKeyNot($wallet->id)->exists()) {
            throw ValidationException::withMessages(['wallet' => __('messages.wallet_last')]);
        }

        $wallet->update(['is_active' => ! $wallet->is_active]);

        return response()->json([
            'message' => __($wallet->is_active ? 'messages.wallet_restored' : 'messages.wallet_archived'),
            'data' => new WalletResource($wallet),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $wallet = $user->wallets()->findOrFail($id);

        if ($this->service->isUsed($wallet)) {
            throw ValidationException::withMessages(['wallet' => __('messages.wallet_used')]);
        }
        if ($wallet->is_active && ! $user->wallets()->where('is_active', true)->whereKeyNot($wallet->id)->exists()) {
            throw ValidationException::withMessages(['wallet' => __('messages.wallet_last')]);
        }

        $wallet->delete();

        return response()->json(['message' => __('messages.wallet_deleted')]);
    }
}
