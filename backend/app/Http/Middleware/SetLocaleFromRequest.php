<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocaleFromRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/*')) {
            $locale = $request->header('Accept-Language');
            app()->setLocale(in_array($locale, ['id', 'en', 'su'], true) ? $locale : 'id');
        }

        return $next($request);
    }
}
