<?php

namespace App\Services;

use App\Http\Resources\BudgetResource;
use App\Http\Resources\TransactionResource;
use App\Models\User;
use App\Support\DateSql;
use App\Support\Money;
use App\Support\Period;

class DashboardService
{
    /** Periode ≤ batas ini ditampilkan per hari, selebihnya per bulan. */
    public const DAILY_CHART_MAX_DAYS = 62;

    public function __construct(
        private TransactionService $transactions,
        private BudgetService $budgets,
    ) {}

    public function build(User $user, Period $period, array $filters): array
    {
        $totals = $this->transactions->totals($user, $period, $filters);
        $breakdown = $this->categoryBreakdown($user, $period, $filters, $totals['expense']);
        $budgets = $this->budgets->forMonth($user, $period->end->month, $period->end->year);

        return [
            'period' => $period->toArray(),
            'summary' => [
                'income' => $totals['income'],
                'expense' => $totals['expense'],
                'balance' => $totals['balance'],
                'avg_daily_expense' => Money::of($totals['expense'] / $period->days()),
                'expense_ratio' => $totals['income'] > 0
                    ? round($totals['expense'] / $totals['income'] * 100, 2)
                    : null,
                'transaction_count' => $totals['count'],
            ],
            'chart' => $this->chart($user, $period, $filters),
            'category_breakdown' => $breakdown,
            'top_categories' => array_slice($breakdown, 0, 5),
            'largest_transactions' => TransactionResource::collection(
                $this->transactions->query($user, $period, $filters)
                    ->ofType('expense')
                    ->with('category')
                    ->orderByDesc('amount')
                    ->orderByDesc('id')
                    ->limit(5)
                    ->get()
            ),
            'budgets' => BudgetResource::collection($budgets),
        ];
    }

    /**
     * Deret pemasukan/pengeluaran lengkap (hari/bulan kosong = 0) dari satu query GROUP BY.
     */
    private function chart(User $user, Period $period, array $filters): array
    {
        $daily = $period->days() <= self::DAILY_CHART_MAX_DAYS;
        $labels = $daily ? $period->dates() : $period->months();
        $groupExpr = $daily ? DateSql::day('transaction_date') : DateSql::yearMonth('transaction_date');

        $rows = $this->transactions->groupedTotals($user, $period, $filters, $groupExpr);

        return [
            'granularity' => $daily ? 'day' : 'month',
            'labels' => $labels,
            'income' => array_map(fn ($l) => $rows[$l]['income'] ?? 0.0, $labels),
            'expense' => array_map(fn ($l) => $rows[$l]['expense'] ?? 0.0, $labels),
        ];
    }

    /**
     * Pengeluaran per kategori, urut total desc.
     */
    private function categoryBreakdown(User $user, Period $period, array $filters, float $expenseTotal): array
    {
        return $this->transactions->query($user, $period, $filters)
            ->ofType('expense')
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->toBase()
            ->select('transactions.category_id', 'categories.name', 'categories.icon', 'categories.color')
            ->selectRaw('SUM(transactions.amount) AS total')
            ->groupBy('transactions.category_id', 'categories.name', 'categories.icon', 'categories.color')
            ->orderByDesc('total')
            ->orderBy('categories.name')
            ->get()
            ->map(fn ($r) => [
                'category_id' => (int) $r->category_id,
                'name' => $r->name,
                'icon' => $r->icon,
                'color' => $r->color,
                'total' => Money::of($r->total),
                'percentage' => Money::percent($r->total, $expenseTotal),
            ])
            ->all();
    }
}
