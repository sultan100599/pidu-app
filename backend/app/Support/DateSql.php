<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Helper ekspresi tanggal SQL lintas driver (sqlite/mysql).
 *
 * Semua ekspresi tanggal untuk GROUP BY / agregasi harus lewat class ini
 * supaya migrasi ke MySQL hanya perlu ganti .env (DB_CONNECTION).
 */
class DateSql
{
    protected static function driver(): string
    {
        return DB::getDriverName();
    }

    /**
     * Ekspresi untuk grouping per hari, hasil: 'YYYY-MM-DD'.
     */
    public static function day(string $column): string
    {
        return match (self::driver()) {
            'mysql' => "DATE($column)",
            default => "strftime('%Y-%m-%d', $column)",
        };
    }

    /**
     * Ekspresi untuk grouping per bulan, hasil: 'YYYY-MM'.
     */
    public static function yearMonth(string $column): string
    {
        return match (self::driver()) {
            'mysql' => "DATE_FORMAT($column, '%Y-%m')",
            default => "strftime('%Y-%m', $column)",
        };
    }

    /**
     * Ekspresi tahun (angka), untuk grouping per tahun.
     */
    public static function year(string $column): string
    {
        return match (self::driver()) {
            'mysql' => "YEAR($column)",
            default => "CAST(strftime('%Y', $column) AS INTEGER)",
        };
    }

    /**
     * Ekspresi bulan (angka 1-12).
     */
    public static function month(string $column): string
    {
        return match (self::driver()) {
            'mysql' => "MONTH($column)",
            default => "CAST(strftime('%m', $column) AS INTEGER)",
        };
    }
}
