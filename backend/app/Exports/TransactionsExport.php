<?php

namespace App\Exports;

use App\Exports\Sheets\TransactionsSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Export daftar transaksi sesuai filter (satu sheet).
 */
class TransactionsExport implements WithMultipleSheets
{
    public function __construct(private TransactionsSheet $sheet) {}

    public function sheets(): array
    {
        return [$this->sheet];
    }
}
