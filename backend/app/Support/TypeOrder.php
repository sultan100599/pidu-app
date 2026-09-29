<?php

namespace App\Support;

/**
 * Urutan jenis transaksi yang sama di semua driver.
 *
 * Kolom `type` adalah ENUM('income','expense'): SQLite menyimpannya sebagai teks
 * (ORDER BY → alfabetis: expense dulu), MySQL/MariaDB mengurutkan ENUM menurut
 * urutan definisi (income dulu). Jangan `orderBy('type')`; pakai ekspresi ini.
 */
class TypeOrder
{
    /** Pengeluaran dulu, lalu pemasukan. */
    public static function expenseFirst(string $column = 'type'): string
    {
        return "CASE {$column} WHEN 'expense' THEN 0 ELSE 1 END";
    }

    /** Pemasukan dulu, lalu pengeluaran. */
    public static function incomeFirst(string $column = 'type'): string
    {
        return "CASE {$column} WHEN 'income' THEN 0 ELSE 1 END";
    }
}
