<?php

namespace App\Support;

/**
 * Normalisasi nilai uang untuk response API: selalu number (float) 2 desimal.
 */
class Money
{
    public static function of(mixed $value): float
    {
        return round((float) ($value ?? 0), 2);
    }

    /**
     * Persentase a/b*100 dibulatkan 2 desimal; 0 jika pembagi 0.
     */
    public static function percent(mixed $part, mixed $total): float
    {
        $total = (float) $total;

        return $total > 0 ? round((float) $part / $total * 100, 2) : 0.0;
    }
}
