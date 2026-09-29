<?php

namespace App\Services;

use App\Exports\AllDataExport;
use App\Exports\Sheets\ArraySheet;
use App\Exports\Sheets\TransactionsSheet;
use App\Exports\TransactionsExport;
use App\Http\Resources\BudgetResource;
use App\Models\User;
use App\Support\Period;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class ExportService
{
    /** Batas baris PDF: dompdf berat untuk tabel panjang; lebih dari ini → pakai Excel. */
    public const PDF_MAX_ROWS = 2000;

    private const MONEY = ArraySheet::MONEY;

    private const DATE = ArraySheet::DATE;

    private const PERCENT = ArraySheet::PERCENT;

    public function __construct(
        private TransactionService $transactions,
        private ReportService $reports,
        private BudgetService $budgets,
    ) {}

    /**
     * Query transaksi terfilter + kategori, urutan sama seperti daftar transaksi.
     */
    public function transactionsQuery(User $user, ?Period $period, array $filters, string $sort = 'transaction_date', string $dir = 'desc'): HasMany|Builder
    {
        return $this->transactions->query($user, $period, $filters)
            ->with('category')
            ->orderBy($sort, $dir)
            ->orderBy('id', $dir);
    }

    public function transactionsExcel(User $user, ?Period $period, array $filters, string $sort, string $dir): TransactionsExport
    {
        return new TransactionsExport(new TransactionsSheet(
            $this->transactionsQuery($user, $period, $filters, $sort, $dir),
            $this->transactions->totals($user, $period, $filters),
        ));
    }

    /**
     * Data untuk view PDF.
     */
    public function transactionsPdfData(User $user, ?Period $period, array $filters, string $sort, string $dir, array $filterSummary): array
    {
        return [
            'user' => $user,
            'period' => $period,
            'filterSummary' => $filterSummary,
            'totals' => $this->transactions->totals($user, $period, $filters),
            'transactions' => $this->transactionsQuery($user, $period, $filters, $sort, $dir)->get(),
            'generatedAt' => now(),
        ];
    }

    public function countTransactions(User $user, ?Period $period, array $filters): int
    {
        return $this->transactions->query($user, $period, $filters)->count();
    }

    /**
     * Semua data satu tahun, 7 sheet. Angka memakai service laporan yang sama dengan halaman laporan.
     */
    public function allData(User $user, int $year): AllDataExport
    {
        $period = Period::year($year);

        $daily = $this->reports->daily($user, $period, []);
        $weekly = \App\Support\Locale::in('id', fn () => $this->reports->weekly($user, $period, []));
        $monthly = \App\Support\Locale::in('id', fn () => $this->reports->monthly($user, $year, []));
        $yearly = $this->reports->yearly($user, []);
        $categories = $this->reports->categoryTotals($user, $period);
        $budgets = $this->budgetRows($user, $year);

        $summaryHeadings = ['Pemasukan', 'Pengeluaran', 'Saldo', 'Transaksi'];
        $summaryFormats = ['B' => self::MONEY, 'C' => self::MONEY, 'D' => self::MONEY];
        $totalRow = fn (array $t, int $pad = 0) => ['Total', ...array_fill(0, $pad, null), $t['income'], $t['expense'], $t['balance'], $t['count']];
        $values = fn (array $r) => [$r['income'], $r['expense'], $r['balance'], $r['count']];

        return new AllDataExport([
            new TransactionsSheet(
                $this->transactionsQuery($user, $period, [], 'transaction_date', 'asc'),
                $this->transactions->totals($user, $period),
            ),
            new ArraySheet(
                'Harian',
                ['Tanggal', ...$summaryHeadings],
                [
                    ...array_map(fn ($r) => [ExcelDate::stringToExcel($r['date']), ...$values($r)], $daily['rows']),
                    $totalRow($daily['totals']),
                ],
                ['A' => self::DATE, ...$summaryFormats],
                lastRowIsTotal: true,
            ),
            new ArraySheet(
                'Mingguan',
                ['Minggu', 'Dari', 'Sampai', ...$summaryHeadings],
                [
                    ...array_map(fn ($r) => [
                        $r['label'],
                        ExcelDate::stringToExcel($r['start_date']),
                        ExcelDate::stringToExcel($r['end_date']),
                        ...$values($r),
                    ], $weekly['rows']),
                    $totalRow($weekly['totals'], 2),
                ],
                ['B' => self::DATE, 'C' => self::DATE, 'D' => self::MONEY, 'E' => self::MONEY, 'F' => self::MONEY],
                lastRowIsTotal: true,
            ),
            new ArraySheet(
                'Bulanan',
                ['Bulan', ...$summaryHeadings],
                [
                    ...array_map(fn ($r) => ["{$r['label']} {$year}", ...$values($r)], $monthly['rows']),
                    $totalRow($monthly['totals']),
                ],
                $summaryFormats,
                lastRowIsTotal: true,
            ),
            new ArraySheet(
                'Tahunan',
                ['Tahun', ...$summaryHeadings],
                [
                    ...array_map(fn ($r) => [$r['year'], ...$values($r)], $yearly['rows']),
                    $totalRow($yearly['totals']),
                ],
                $summaryFormats,
                lastRowIsTotal: true,
            ),
            new ArraySheet(
                'Kategori',
                ['Kategori', 'Jenis', 'Total', 'Transaksi', 'Porsi dari jenisnya'],
                array_map(fn ($r) => [
                    $r['name'],
                    $r['type'] === 'income' ? 'Pemasukan' : 'Pengeluaran',
                    $r['total'],
                    $r['count'],
                    $r['percentage'],
                ], $categories),
                ['C' => self::MONEY, 'E' => self::PERCENT],
            ),
            new ArraySheet(
                'Budget',
                ['Bulan', 'Kategori', 'Budget', 'Terpakai', 'Sisa', 'Persentase', 'Status'],
                $budgets,
                ['C' => self::MONEY, 'D' => self::MONEY, 'E' => self::MONEY, 'F' => self::PERCENT],
            ),
        ]);
    }

    /**
     * Budget 12 bulan dalam setahun + pemakaiannya (status sama dengan halaman Budget).
     *
     * @return list<list<mixed>>
     */
    private function budgetRows(User $user, int $year): array
    {
        $statusLabels = ['ok' => 'Aman', 'warning' => 'Hampir habis', 'exceeded' => 'Terlampaui'];
        $rows = [];

        foreach (Period::MONTHS as $month => $monthName) {
            /** @var Collection $budgets */
            $budgets = $this->budgets->forMonth($user, $month, $year);
            foreach ($budgets as $budget) {
                $r = (new BudgetResource($budget))->resolve();
                $rows[] = [
                    "{$monthName} {$year}",
                    $budget->category->name,
                    $r['amount'],
                    $r['used'],
                    $r['remaining'],
                    $r['percentage'],
                    $statusLabels[$r['status']],
                ];
            }
        }

        return $rows;
    }
}
