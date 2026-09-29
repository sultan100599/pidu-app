<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\StringValueBinder;

/**
 * Pembaca baris mentah untuk impor.
 *
 * Nilai CSV dibaca sebagai teks apa adanya. Tanpa ini PhpSpreadsheet menebak tipe:
 * "12.500" (dua belas ribu lima ratus, format Indonesia) menjadi 12.5 → nominal salah
 * tanpa error. Teks lalu diurai TransactionImportService (paham "1.500.000,50").
 * Hanya dipakai untuk CSV; xlsx/xls dibaca dengan tipe sel aslinya (angka/tanggal tetap angka).
 */
class RawRowsImport extends StringValueBinder implements WithCustomValueBinder {}
