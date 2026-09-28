<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStrictNullComparison;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;

/**
 * Sheet generik dari array (dipakai untuk rekap Harian/Mingguan/Bulanan/Tahunan/Kategori/Budget).
 * Baris terakhir bisa ditandai sebagai baris total (tebal).
 */
class ArraySheet implements FromArray, ShouldAutoSize, WithColumnFormatting, WithCustomValueBinder, WithEvents, WithHeadings, WithStrictNullComparison, WithTitle
{
    use SafeValues, Styling;

    /**
     * @param  list<string>  $headings
     * @param  list<list<mixed>>  $rows
     * @param  array<string, string>  $formats  kolom => format, mis. ['B' => self::MONEY]
     */
    public function __construct(
        private string $title,
        private array $headings,
        private array $rows,
        private array $formats = [],
        private bool $lastRowIsTotal = false,
    ) {}

    public function array(): array
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function title(): string
    {
        return $this->title;
    }

    public function columnFormats(): array
    {
        return $this->formats;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $this->styleHeader($sheet);
                if ($this->lastRowIsTotal && count($this->rows) > 0) {
                    $last = $sheet->getHighestRow();
                    $sheet->getStyle("A{$last}:{$sheet->getHighestColumn()}{$last}")->getFont()->setBold(true);
                }
            },
        ];
    }
}
