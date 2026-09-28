<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Gaya bersama semua sheet: header tebal berlatar abu-abu, freeze baris header, filter otomatis.
 */
trait Styling
{
    public const MONEY = '#,##0;-#,##0';

    public const DATE = 'dd/mm/yyyy';

    public const PERCENT = '0.00"%"';

    protected function styleHeader(Worksheet $sheet): void
    {
        $lastColumn = $sheet->getHighestColumn();
        $sheet->getStyle("A1:{$lastColumn}1")->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'E9ECEF']],
        ]);
        $sheet->freezePane('A2');
    }

    /**
     * Tambahkan baris kosong lalu baris-baris total (label di kolom A), dicetak tebal.
     *
     * @param  list<array{0: string, 1: string, 2: float|int}>  $totals  [label, kolom nilai, nilai]
     */
    protected function appendTotals(Worksheet $sheet, array $totals, string $format = self::MONEY): void
    {
        $row = $sheet->getHighestRow() + 2;
        foreach ($totals as [$label, $column, $value]) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("{$column}{$row}", $value);
            $sheet->getStyle("{$column}{$row}")->getNumberFormat()->setFormatCode($format);
            $sheet->getStyle("A{$row}:{$column}{$row}")->getFont()->setBold(true);
            $row++;
        }
    }
}
