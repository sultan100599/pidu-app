<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAccountRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Resources\UserResource;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AccountController extends Controller
{
    /**
     * opening_balance (pertanyaan pertama di dashboard) diisi ke dompet utama; kolom di users
     * hanya menandai bahwa user sudah pernah menjawab.
     */
    public function update(UpdateAccountRequest $request, WalletService $wallets): JsonResponse
    {
        $user = $request->user();
        DB::transaction(function () use ($user, $request, $wallets) {
            $user->update($request->validated());
            if ($request->has('opening_balance')) {
                $wallets->setOpeningBalance($user, (float) $request->validated('opening_balance'));
            }
        });

        return response()->json([
            'message' => __('messages.account_updated'),
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Ganti password; sesi di perangkat lain ikut keluar, sesi ini tetap.
     */
    public function password(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->forceFill(['password' => $request->validated('password')])->save();
        $user->tokens()->whereKeyNot($user->currentAccessToken()->getKey())->delete();

        return response()->json(['message' => __('messages.password_changed')]);
    }
}
