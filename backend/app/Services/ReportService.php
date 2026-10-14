<?php

namespace App\Services;

use App\Http\Resources\TransactionResource;
use App\Models\User;
use App\Support\DateSql;
use App\Support\Money;
use App\Support\Period;
use App\Support\TypeOrder;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class ReportService
{
    public function __construct(private TransactionService $transactions) {}

    /**
     * Rekap per hari, termasuk tanggal tanpa transaksi, urut naik.
     */
    public function daily(User $user, Period $period, array $filters): array
    {
        $rows = $this->dailyRows($user, $period, $filters);

        return [
            'period' => $period->toArray(),
            'totals' => $this->sumRows($rows),
            'rows' => $rows,
        ];
    }

    /**
     * Rekap per minggu ISO (Senin–Minggu), dipotong ke rentang periode.
     * Dihitung dari agregat harian DB lalu dikelompokkan di PHP (lintas driver).
     */
    public function weekly(User $user, Period $period, array $filters): array
    {
        $weeks = [];

        foreach ($this->dailyRows($user, $period, $filters) as $day) {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $day['date']);
            $key = $date->startOfWeek(CarbonInterface::MONDAY)->toDateString();

            $weeks[$key] ??= [
                'start_date' => $day['date'],
                'end_date' => $day['date'],
                'income' => 0.0, 'expense' => 0.0, 'count' => 0,
            ];
            $weeks[$key]['end_date'] = $day['date'];
            $weeks[$key]['income'] += $day['income'];
            $weeks[$key]['expense'] += $day['expense'];
            $weeks[$key]['count'] += $day['count'];
        }

        $rows = [];
        $n = 0;
        foreach ($weeks as $w) {
            $n++;
            $rows[] = [
                'week' => $n,
                'label' => __('messages.week', ['number' => $n]),
                'start_date' => $w['start_date'],
                'end_date' => $w['end_date'],
                'income' => Money::of($w['income']),
                'expense' => Money::of($w['expense']),
                'balance' => Money::of($w['income'] - $w['expense']),
                'count' => $w['count'],
            ];
        }

        return [
            'period' => $period->toArray(),
            'totals' => $this->sumRows($rows),
            'rows' => $rows,
        ];
    }

    /**
     * 12 baris bulan untuk satu tahun.
     */
    public function monthly(User $user, int $year, array $filters): array
    {
        $period = Period::year($year);
        $data = $this->transactions->groupedTotals($user, $period, $filters, DateSql::month('transaction_date'));

        $rows = [];
        foreach (trans('messages.months') as $m => $label) {
            $rows[] = ['month' => $m, 'label' => $label] + $this->row($data[(string) $m] ?? null);
        }

        return [
            'year' => $year,
            'period' => $period->toArray(),
            'totals' => $this->sumRows($rows),
            'rows' => $rows,
        ];
    }

    /**
     * Setiap tahun dari tahun transaksi pertama s/d tahun ini (tahun kosong = 0).
     */
    public function yearly(User $user, array $filters): array
    {
        $data = $this->transactions->groupedTotals($user, null, $filters, DateSql::year('transaction_date'));

        $current = CarbonImmutable::today()->year;
        $years = array_map('intval', array_keys($data));
        $from = $years ? min(min($years), $current) : $current;
        $to = $years ? max(max($years), $current) : $current;

        $rows = [];
        for ($y = $from; $y <= $to; $y++) {
            $rows[] = ['year' => $y] + $this->row($data[(string) $y] ?? null);
        }

        return [
            'totals' => $this->sumRows($rows),
            'rows' => $rows,
        ];
    }

    /**
     * Semua tanggal dalam satu bulan untuk tampilan kalender.
     */
    public function calendar(User $user, int $year, int $month, array $filters): array
    {
        $period = Period::month($year, $month);

        return [
            'year' => $year,
            'month' => $month,
            'label' => __('messages.months.'.$month).' '.$year,
            'totals' => $this->sumRows($rows = $this->dailyRows($user, $period, $filters)),
            'days' => array_map(fn ($r) => [
                'date' => $r['date'],
                'income' => $r['income'],
                'expense' => $r['expense'],
                'count' => $r['count'],
            ], $rows),
        ];
    }

    /**
     * Transaksi pada satu tanggal + total.
     */
    public function day(User $user, string $date, array $filters): array
    {
        $period = new Period(
            CarbonImmutable::createFromFormat('!Y-m-d', $date),
            CarbonImmutable::createFromFormat('!Y-m-d', $date),
        );

        return [
            'date' => $date,
            'totals' => $this->transactions->totals($user, $period, $filters),
            'transactions' => TransactionResource::collection(
                $this->transactions->query($user, $period, $filters)
                    ->with('category', 'wallet')
                    ->orderByRaw(TypeOrder::expenseFirst('transactions.type'))
                    ->orderByDesc('amount')
                    ->orderByDesc('id')
                    ->get()
            ),
        ];
    }

    /**
     * Total per kategori (pemasukan & pengeluaran) dalam periode, urut jenis lalu total desc.
     * `percentage` = porsi terhadap total jenis yang sama.
     *
     * @return list<array{category_id: int, name: string, type: string, total: float, count: int, percentage: float}>
     */
    public function categoryTotals(User $user, Period $period, array $filters = []): array
    {
        $rows = $this->transactions->query($user, $period, $filters)
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->toBase()
            ->select('transactions.category_id', 'categories.name', 'transactions.type')
            ->selectRaw('SUM(transactions.amount) AS total, COUNT(*) AS cnt')
            ->groupBy('transactions.category_id', 'categories.name', 'transactions.type')
            ->orderByRaw(TypeOrder::incomeFirst('transactions.type'))
            ->orderByDesc('total')
            ->get();

        $typeTotals = [];
        foreach ($rows as $r) {
            $typeTotals[$r->type] = ($typeTotals[$r->type] ?? 0) + (float) $r->total;
        }

        return $rows->map(fn ($r) => [
            'category_id' => (int) $r->category_id,
            'name' => $r->name,
            'type' => $r->type,
            'total' => Money::of($r->total),
            'count' => (int) $r->cnt,
            'percentage' => Money::percent($r->total, $typeTotals[$r->type]),
        ])->all();
    }

    /**
     * @return list<array{date: string, income: float, expense: float, balance: float, count: int}>
     */
    private function dailyRows(User $user, Period $period, array $filters): array
    {
        $data = $this->transactions->groupedTotals($user, $period, $filters, DateSql::day('transaction_date'));

        return array_map(
            fn ($date) => ['date' => $date] + $this->row($data[$date] ?? null),
            $period->dates()
        );
    }

    private function row(?array $agg): array
    {
        $income = $agg['income'] ?? 0.0;
        $expense = $agg['expense'] ?? 0.0;

        return [
            'income' => $income,
            'expense' => $expense,
            'balance' => Money::of($income - $expense),
            'count' => $agg['count'] ?? 0,
        ];
    }

    private function sumRows(array $rows): array
    {
        $income = Money::of(array_sum(array_column($rows, 'income')));
        $expense = Money::of(array_sum(array_column($rows, 'expense')));

        return [
            'income' => $income,
            'expense' => $expense,
            'balance' => Money::of($income - $expense),
            'count' => (int) array_sum(array_column($rows, 'count')),
        ];
    }
}
