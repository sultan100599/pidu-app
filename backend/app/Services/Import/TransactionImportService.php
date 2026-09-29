<?php

namespace App\Services\Import;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use App\Imports\RawRowsImport;
use App\Models\User;
use App\Support\Money;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

/**
 * Impor transaksi dari xlsx/xls/csv. Kolom sama dengan file export, sehingga file export
 * dan backup bisa diimpor ulang. Validasi dulu (dry run), lalu commit semua-atau-tidak-sama-sekali.
 */
class TransactionImportService
{
    public const MAX_ROWS = 5000;

    private const MAX_ERRORS_SHOWN = 100;

    private const PREVIEW_ROWS = 10;

    /** Alias header (lowercase) → field. */
    private const HEADERS = [
        'tanggal' => 'date', 'date' => 'date', 'tgl' => 'date',
        'jenis' => 'type', 'type' => 'type', 'tipe' => 'type',
        'kategori' => 'category', 'category' => 'category',
        'deskripsi' => 'description', 'description' => 'description', 'keterangan' => 'description',
        'catatan' => 'notes', 'notes' => 'notes', 'note' => 'notes',
        'metode' => 'payment_method', 'metode pembayaran' => 'payment_method', 'payment_method' => 'payment_method', 'payment method' => 'payment_method',
        'nominal' => 'amount', 'jumlah' => 'amount', 'amount' => 'amount',
    ];

    private const REQUIRED = ['date' => 'Tanggal', 'category' => 'Kategori', 'amount' => 'Nominal'];

    /** Baris penutup file export yang dilewati. */
    private const FOOTER_LABELS = ['total', 'total pemasukan', 'total pengeluaran', 'saldo'];

    /**
     * Validasi seluruh file tanpa menulis apa pun.
     *
     * @return array{result: array, rows: list<array>}
     */
    public function analyze(User $user, UploadedFile $file): array
    {
        $sheet = $this->readFirstSheet($file);
        $columns = $this->mapHeader($sheet[0] ?? []);

        $categories = $this->categoryIndex($user);
        $rows = [];
        $errors = [];
        $newCategories = [];
        $dataRows = 0;

        foreach (array_slice($sheet, 1, null, true) as $index => $raw) {
            $excelRow = $index + 1;
            $cells = $this->pick($raw, $columns);

            if ($this->isBlank($cells) || $this->isFooter($cells)) {
                continue;
            }
            if (++$dataRows > self::MAX_ROWS) {
                throw ValidationException::withMessages([
                    'file' => sprintf('Maksimal %s baris per impor. Pecah file menjadi beberapa bagian.', number_format(self::MAX_ROWS, 0, ',', '.')),
                ]);
            }

            [$row, $messages] = $this->parseRow($cells);
            if ($messages) {
                $errors[] = ['row' => $excelRow, 'messages' => $messages];

                continue;
            }

            $key = $row['type'].'|'.Str::lower($row['category']);
            $row['category_id'] = $categories[$key] ?? null;
            if ($row['category_id'] === null) {
                $newCategories[$key] = ['name' => $row['category'], 'type' => $row['type']];
            }
            $row['row'] = $excelRow;
            $rows[] = $row;
        }

        if ($dataRows === 0) {
            throw ValidationException::withMessages(['file' => 'File tidak berisi baris transaksi.']);
        }

        $duplicates = $this->markDuplicates($user, $rows);
        $toImport = array_values(array_filter($rows, fn ($r) => ! $r['duplicate']));

        return [
            'rows' => $rows,
            'result' => [
                'total_rows' => $dataRows,
                'valid' => count($rows),
                'invalid' => count($errors),
                'duplicates' => $duplicates,
                'to_import' => count($toImport),
                'income' => Money::of(array_sum(array_map(fn ($r) => $r['type'] === 'income' ? $r['amount'] : 0, $toImport))),
                'expense' => Money::of(array_sum(array_map(fn ($r) => $r['type'] === 'expense' ? $r['amount'] : 0, $toImport))),
                'new_categories' => array_values($newCategories),
                'errors' => array_slice($errors, 0, self::MAX_ERRORS_SHOWN),
                'errors_truncated' => count($errors) > self::MAX_ERRORS_SHOWN,
                'preview' => array_map(fn ($r) => [
                    'row' => $r['row'],
                    'transaction_date' => $r['date'],
                    'type' => $r['type'],
                    'category' => $r['category'],
                    'amount' => $r['amount'],
                    'payment_method' => $r['payment_method'],
                    'description' => $r['description'],
                    'duplicate' => $r['duplicate'],
                ], array_slice($rows, 0, self::PREVIEW_ROWS)),
            ],
        ];
    }

    /**
     * Simpan baris valid (analisis harus bersih). Kategori baru dibuat. Semua dalam satu transaksi DB.
     *
     * @return array{imported: int, skipped_duplicates: int, new_categories: int}
     */
    public function commit(User $user, array $rows, bool $skipDuplicates): array
    {
        return DB::transaction(function () use ($user, $rows, $skipDuplicates) {
            $now = now();
            $created = 0;
            $categoryIds = $this->categoryIndex($user);

            $inserts = [];
            $skipped = 0;
            foreach ($rows as $row) {
                if ($skipDuplicates && $row['duplicate']) {
                    $skipped++;

                    continue;
                }
                $key = $row['type'].'|'.Str::lower($row['category']);
                if (! isset($categoryIds[$key])) {
                    $categoryIds[$key] = $user->categories()->create([
                        'name' => $row['category'],
                        'type' => $row['type'],
                        'icon' => 'bi-tag',
                        'color' => '#6c757d',
                        'is_active' => true,
                    ])->id;
                    $created++;
                }
                $inserts[] = [
                    'user_id' => $user->id,
                    'category_id' => $categoryIds[$key],
                    'transaction_date' => $row['date'],
                    'type' => $row['type'],
                    'amount' => $row['amount'],
                    'payment_method' => $row['payment_method'],
                    'description' => $row['description'],
                    'notes' => $row['notes'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($inserts, 500) as $chunk) {
                DB::table('transactions')->insert($chunk);
            }

            return ['imported' => count($inserts), 'skipped_duplicates' => $skipped, 'new_categories' => $created];
        });
    }

    // ---------------------------------------------------------------- membaca file

    /**
     * @return array<int, array<int, mixed>>
     */
    private function readFirstSheet(UploadedFile $file): array
    {
        try {
            // Tanpa kalkulasi formula & tanpa format: tanggal tetap serial Excel, formula tetap teks.
            // CSV dibaca sebagai teks mentah (lihat RawRowsImport); xlsx/xls memakai tipe sel apa adanya.
            $isCsv = Str::lower($file->getClientOriginalExtension()) === 'csv';
            $sheets = Excel::toArray($isCsv ? new RawRowsImport : new \stdClass, $file);
        } catch (Throwable $e) {
            report($e);
            throw ValidationException::withMessages(['file' => 'File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.']);
        }

        return $sheets[0] ?? [];
    }

    /**
     * @return array<string, int> field → index kolom
     */
    private function mapHeader(array $header): array
    {
        $columns = [];
        foreach ($header as $i => $label) {
            $field = self::HEADERS[Str::lower(trim((string) $label))] ?? null;
            if ($field && ! isset($columns[$field])) {
                $columns[$field] = $i;
            }
        }

        $missing = array_diff_key(self::REQUIRED, $columns);
        if ($missing) {
            throw ValidationException::withMessages([
                'file' => 'Kolom wajib tidak ditemukan di baris pertama: '.implode(', ', $missing).'. Gunakan template impor.',
            ]);
        }

        return $columns;
    }

    private function pick(array $raw, array $columns): array
    {
        $cells = [];
        foreach (['date', 'type', 'category', 'description', 'notes', 'payment_method', 'amount'] as $field) {
            $value = isset($columns[$field]) ? ($raw[$columns[$field]] ?? null) : null;
            $cells[$field] = is_string($value) ? trim($value) : $value;
        }

        return $cells;
    }

    private function isBlank(array $cells): bool
    {
        return collect($cells)->every(fn ($v) => $v === null || $v === '');
    }

    private function isFooter(array $cells): bool
    {
        return is_string($cells['date'])
            && in_array(Str::lower($cells['date']), self::FOOTER_LABELS, true)
            && ($cells['category'] === null || $cells['category'] === '');
    }

    // ---------------------------------------------------------------- parsing baris

    /**
     * @return array{0: array, 1: list<string>} [row, pesan error]
     */
    private function parseRow(array $c): array
    {
        $errors = [];

        $date = $this->parseDate($c['date']);
        if ($date === null) {
            $errors[] = 'Tanggal tidak valid (gunakan tanggal Excel atau format dd/mm/yyyy).';
        }

        $amount = $this->parseAmount($c['amount']);
        if ($amount === null) {
            $errors[] = 'Nominal harus berupa angka.';
        }

        $type = $this->parseType($c['type'], $amount);
        if ($type === false) {
            $errors[] = 'Jenis harus Pemasukan atau Pengeluaran.';
        } elseif ($type === null) {
            $errors[] = 'Jenis wajib diisi (Pemasukan/Pengeluaran).';
        }

        if ($amount !== null) {
            $amount = round(abs($amount), 2);
            if ($amount <= 0) {
                $errors[] = 'Nominal harus lebih dari 0.';
            } elseif ($amount > 999999999999) {
                $errors[] = 'Nominal terlalu besar.';
            }
        }

        $category = $c['category'] === null ? '' : (string) $c['category'];
        if ($category === '') {
            $errors[] = 'Kategori wajib diisi.';
        } elseif (mb_strlen($category) > 100) {
            $errors[] = 'Nama kategori maksimal 100 karakter.';
        }

        $method = $this->parsePaymentMethod($c['payment_method']);
        if ($method === null) {
            $errors[] = 'Metode tidak dikenal (pilihan: '.implode(', ', array_map(fn ($m) => $m->label(), PaymentMethod::cases())).').';
        }

        $description = $c['description'] === null || $c['description'] === '' ? null : (string) $c['description'];
        if ($description !== null && mb_strlen($description) > 255) {
            $errors[] = 'Deskripsi maksimal 255 karakter.';
        }
        $notes = $c['notes'] === null || $c['notes'] === '' ? null : (string) $c['notes'];
        if ($notes !== null && mb_strlen($notes) > 5000) {
            $errors[] = 'Catatan maksimal 5000 karakter.';
        }

        return [[
            'date' => $date,
            'type' => $type,
            'category' => $category,
            'amount' => $amount,
            'payment_method' => $method,
            'description' => $description,
            'notes' => $notes,
        ], $errors];
    }

    private function parseDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_int($value) || is_float($value)) {
            // Serial Excel: 1 = 1900-01-01; batasi ke rentang masuk akal (1950–2100).
            if ($value < 18264 || $value > 73051) {
                return null;
            }

            return CarbonImmutable::instance(ExcelDate::excelToDateTimeObject($value))->toDateString();
        }
        foreach (['!d/m/Y', '!d-m-Y', '!Y-m-d', '!d/m/y', '!d.m.Y'] as $format) {
            try {
                // Carbon 3 melempar exception bila format tidak cocok.
                $date = CarbonImmutable::createFromFormat($format, (string) $value);
            } catch (Throwable) {
                continue;
            }
            // Bandingkan balik supaya tanggal "meluber" (31/02 → 03/03) ditolak.
            if ($date && $date->format(ltrim($format, '!')) === (string) $value && $date->year >= 1950 && $date->year <= 2100) {
                return $date->toDateString();
            }
        }

        return null;
    }

    private function parseAmount(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }
        if (! is_string($value) || $value === '') {
            return null;
        }
        // "Rp 1.500.000,50" / "-1.500.000" / "1500000.5"
        $s = str_replace(['Rp', 'rp', 'RP', ' ', "\u{00A0}"], '', $value);
        if (str_contains($s, ',')) {
            $s = str_replace(['.', ','], ['', '.'], $s);
        } elseif (substr_count($s, '.') > 1 || preg_match('/\.\d{3}$/', $s)) {
            $s = str_replace('.', '', $s);
        }

        return is_numeric($s) ? (float) $s : null;
    }

    /**
     * @return string|null|false  'income'|'expense', null = kosong & tak bisa ditebak, false = teks tak dikenal
     */
    private function parseType(mixed $value, ?float $amount): string|null|false
    {
        $v = Str::lower(trim((string) $value));
        if ($v === '') {
            return $amount !== null && $amount < 0 ? TransactionType::Expense->value : null;
        }

        return match ($v) {
            'pemasukan', 'income', 'masuk' => TransactionType::Income->value,
            'pengeluaran', 'expense', 'keluar' => TransactionType::Expense->value,
            default => false,
        };
    }

    private function parsePaymentMethod(mixed $value): ?string
    {
        $v = Str::lower(trim((string) $value));
        if ($v === '') {
            return PaymentMethod::Cash->value;
        }
        foreach (PaymentMethod::cases() as $method) {
            if ($v === $method->value || $v === Str::lower($method->label())) {
                return $method->value;
            }
        }

        return match ($v) {
            'tunai' => PaymentMethod::Cash->value,
            'kartu debit' => PaymentMethod::Debit->value,
            'credit card', 'kredit' => PaymentMethod::CreditCard->value,
            'ewallet', 'e wallet' => PaymentMethod::EWallet->value,
            default => null,
        };
    }

    // ---------------------------------------------------------------- kategori & duplikat

    /**
     * @return array<string, int> "type|nama lowercase" → id
     */
    private function categoryIndex(User $user): array
    {
        return $user->categories()->get(['id', 'name', 'type'])
            ->mapWithKeys(fn ($c) => [$c->type->value.'|'.Str::lower($c->name) => $c->id])
            ->all();
    }

    /**
     * Tandai baris yang sudah ada di database (tanggal + jenis + kategori + nominal + deskripsi).
     * Dihitung per kemunculan: jika DB punya 1 dan file punya 2 yang kembar, hanya 1 yang dianggap duplikat.
     *
     * @param  list<array>  $rows  (diubah: menambah key 'duplicate')
     */
    private function markDuplicates(User $user, array &$rows): int
    {
        if ($rows === []) {
            return 0;
        }

        $dates = array_column($rows, 'date');
        $existing = [];
        $user->transactions()
            ->with('category:id,name')
            ->whereBetween('transaction_date', [min($dates), max($dates)])
            ->get(['id', 'category_id', 'transaction_date', 'type', 'amount', 'description'])
            ->each(function ($t) use (&$existing) {
                $key = $this->dedupeKey(
                    $t->transaction_date->toDateString(), $t->type->value, (string) $t->category?->name, (float) $t->amount, $t->description,
                );
                $existing[$key] = ($existing[$key] ?? 0) + 1;
            });

        $count = 0;
        foreach ($rows as &$row) {
            $key = $this->dedupeKey($row['date'], $row['type'], $row['category'], $row['amount'], $row['description']);
            $row['duplicate'] = ($existing[$key] ?? 0) > 0;
            if ($row['duplicate']) {
                $existing[$key]--;
                $count++;
            }
        }

        return $count;
    }

    private function dedupeKey(string $date, string $type, string $category, float $amount, ?string $description): string
    {
        return implode('|', [$date, $type, Str::lower($category), number_format($amount, 2, '.', ''), Str::lower((string) $description)]);
    }
}
