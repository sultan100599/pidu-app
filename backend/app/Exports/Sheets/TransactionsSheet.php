<?php

namespace App\Exports\Sheets;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Sheet daftar transaksi dari query (dibaca per chunk oleh Laravel Excel),
 * diakhiri baris total pemasukan / pengeluaran / saldo.
 */
class TransactionsSheet implements FromQuery, ShouldAutoSize, WithColumnFormatting, WithCustomValueBinder, WithEvents, WithHeadings, WithMapping, WithTitle
{
    use SafeValues, Styling;

    /**
     * @param  array{income: float, expense: float, balance: float, count: int}  $totals
     */
    public function __construct(
        private $query,
        private array $totals,
        private string $title = 'Transaksi',
    ) {}

    public function query()
    {
        return $this->query;
    }

    public function title(): string
    {
        return $this->title;
    }

    public function headings(): array
    {
        return ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Catatan', 'Metode', 'Nominal'];
    }

    /**
     * @param  Transaction  $trx
     */
    public function map($trx): array
    {
        return [
            ExcelDate::dateTimeToExcel($trx->transaction_date),
            $trx->type->label('id'),
            $trx->category?->name,
            $trx->description,
            $trx->notes,
            $trx->payment_method->label('id'),
            // Pengeluaran negatif supaya kolom bisa langsung dijumlah = saldo.
            ($trx->type->value === 'expense' ? -1 : 1) * (float) $trx->amount,
        ];
    }

    public function columnFormats(): array
    {
        return ['A' => self::DATE, 'G' => self::MONEY];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $this->styleHeader($sheet);
                $this->appendTotals($sheet, [
                    ['Total pemasukan', 'G', $this->totals['income']],
                    ['Total pengeluaran', 'G', -$this->totals['expense']],
                    ['Saldo', 'G', $this->totals['balance']],
                ]);
            },
        ];
    }
}
