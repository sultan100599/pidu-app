<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global agar endpoint API yang tidak dikenal juga menerima locale.
        $middleware->prepend(\App\Http\Middleware\SetLocaleFromRequest::class);
        // Request API yang belum auth → 401 JSON, bukan redirect ke route login.
        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*') ? null : route('login')
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn ($request) => $request->is('api/*'));

        // 404 API: model tidak ditemukan / endpoint tidak ada.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                $message = $e->getPrevious() instanceof ModelNotFoundException
                    ? __('messages.not_found')
                    : __('messages.endpoint_not_found');

                return response()->json(['message' => $message], 404);
            }
        });

        // Error DB: tetap di-log (report default), response generik tanpa detail SQL.
        $exceptions->render(function (QueryException $e, Request $request) {
            if ($request->is('api/*') && ! config('app.debug')) {
                return response()->json(['message' => __('messages.server_error')], 500);
            }
        });

        // Error 500 lain di production: pesan generik tanpa trace.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if ($request->is('api/*') && $response->getStatusCode() >= 500 && ! config('app.debug')) {
                return response()->json(['message' => __('messages.server_error')], $response->getStatusCode());
            }

            if ($request->is('api/*') && in_array($response->getStatusCode(), [401, 403, 429], true)) {
                $key = [401 => 'unauthenticated', 403 => 'forbidden', 429 => 'throttled'][$response->getStatusCode()];
                $response->setContent(json_encode(['message' => __("messages.$key")]));
            }

            if ($request->is('api/*') && $e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json(['message' => collect($e->errors())->flatten()->first() ?? __('messages.validation_failed'), 'errors' => $e->errors()], 422);
            }

            return $response;
        });
    })->create();
