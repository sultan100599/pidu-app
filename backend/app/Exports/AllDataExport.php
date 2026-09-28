<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * "Export Semua ke Excel": Transaksi, Harian, Mingguan, Bulanan, Tahunan, Kategori, Budget.
 * Sheet dirakit oleh ExportService.
 */
class AllDataExport implements WithMultipleSheets
{
    /**
     * @param  list<object>  $sheets
     */
    public function __construct(private array $sheets) {}

    public function sheets(): array
    {
        return $this->sheets;
    }
}
