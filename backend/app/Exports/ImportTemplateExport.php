<?php

namespace App\Exports;

use App\Enums\PaymentMethod;
use App\Exports\Sheets\ArraySheet;
use App\Models\User;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Template impor: sheet "Transaksi" (kolom sama dengan export + contoh) dan sheet "Petunjuk".
 */
class ImportTemplateExport implements WithMultipleSheets
{
    public function __construct(private User $user) {}

    public function sheets(): array
    {
        $today = now();
        $examples = [
            [ExcelDate::dateTimeToExcel($today->copy()->startOfMonth()), 'Pemasukan', 'Gaji', 'Gaji bulanan', null, 'Transfer', 8500000],
            [ExcelDate::dateTimeToExcel($today), 'Pengeluaran', 'Makanan', 'Makan siang', 'Contoh baris — hapus sebelum impor', 'QRIS', 35000],
        ];

        $categories = $this->user->categories()->where('is_active', true)->orderBy('name')->get(['name', 'type']);
        $byType = fn (string $type) => $categories->where('type.value', $type)->pluck('name')->implode(', ');

        $guide = [
            ['Tanggal', 'Wajib', 'Tanggal Excel atau teks dd/mm/yyyy (mis. 28/09/2026).'],
            ['Jenis', 'Wajib*', 'Pemasukan atau Pengeluaran. *Boleh kosong jika Nominal negatif (dianggap Pengeluaran).'],
            ['Kategori', 'Wajib', 'Nama kategori. Jika belum ada, kategori baru dibuat otomatis saat impor.'],
            ['Deskripsi', 'Opsional', 'Maksimal 255 karakter.'],
            ['Catatan', 'Opsional', 'Maksimal 5000 karakter.'],
            ['Metode', 'Opsional', 'Kosong = Cash. Pilihan: '.implode(', ', array_map(fn ($m) => $m->label(), PaymentMethod::cases())).'.'],
            ['Nominal', 'Wajib', 'Angka lebih dari 0 (tanda minus diabaikan). Contoh: 1500000 atau 1.500.000,50.'],
            [null, null, null],
            ['Kategori pengeluaran Anda', null, $byType('expense')],
            ['Kategori pemasukan Anda', null, $byType('income')],
            [null, null, null],
            ['Catatan', null, 'Maks. 5.000 baris per impor. Baris yang sama persis dengan transaksi yang sudah ada (tanggal, jenis, kategori, nominal, deskripsi) dilewati. File hasil Export/Backup Pidu-App bisa langsung diimpor.'],
        ];

        return [
            new ArraySheet(
                'Transaksi',
                ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Catatan', 'Metode', 'Nominal'],
                $examples,
                ['A' => ArraySheet::DATE, 'G' => ArraySheet::MONEY],
            ),
            new ArraySheet('Petunjuk', ['Kolom', 'Status', 'Keterangan'], $guide),
        ];
    }
}
