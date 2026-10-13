<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\DefaultCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mime\Exception\ExceptionInterface as MimeException;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => __('messages.login_failed')]);
        }

        return $this->tokenResponse($user);
    }

    public function register(RegisterRequest $request, DefaultCategoryService $categories): JsonResponse
    {
        $user = DB::transaction(function () use ($request, $categories) {
            $user = User::create($request->validated());
            $categories->createFor($user);

            return $user;
        });

        return $this->tokenResponse($user, 201);
    }

    /**
     * Jawaban selalu sama, terdaftar atau tidak, supaya email user tidak bisa ditebak.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            Password::sendResetLink($request->only('email'));
        } catch (TransportExceptionInterface|MimeException $e) {
            Log::error('Gagal mengirim email atur ulang password', ['error' => $e->getMessage()]);

            return response()->json(['message' => __('messages.mail_failed')], 503);
        }

        return response()->json(['message' => __('messages.reset_link_sent')]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset($request->validated(), function (User $user, string $password) {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __('messages.reset_invalid')]);
        }

        return response()->json(['message' => __('messages.password_reset_done')]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => __('messages.logout')]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken('api')->plainTextToken,
            'user' => new UserResource($user),
        ], $status);
    }
}
