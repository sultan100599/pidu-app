<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAccountRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class AccountController extends Controller
{
    public function update(UpdateAccountRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

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
