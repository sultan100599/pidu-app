<?php

namespace App\Support;

use Closure;

class Locale
{
    public static function in(string $locale, Closure $callback): mixed
    {
        $previous = app()->getLocale();
        app()->setLocale($locale);
        try {
            return $callback();
        } finally {
            app()->setLocale($previous);
        }
    }
}
