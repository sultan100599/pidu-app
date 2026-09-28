<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

/**
 * Cegah formula injection: teks dari user (deskripsi, catatan, nama kategori) yang diawali
 * "=" akan diperlakukan PhpSpreadsheet sebagai formula dan dieksekusi saat file dibuka.
 * Nilai seperti itu dipaksa jadi teks; nilai lain memakai binder default (angka tetap angka).
 */
trait SafeValues
{
    public function bindValue(Cell $cell, $value): bool
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@'], true) && ! is_numeric($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);

            return true;
        }

        return (new DefaultValueBinder)->bindValue($cell, $value);
    }
}
