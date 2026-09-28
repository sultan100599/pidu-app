<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\User;
use App\Support\Money;
use App\Support\Period;
use Illuminate\Database\Eloquent\Collection;

class BudgetService
{
    public function __construct(private TransactionService $transactions) {}

    /**
     * Budget bulan tertentu, masing-masing dengan atribut `used` (dari satu query SUM GROUP BY).
     */
    public function forMonth(User $user, int $month, int $year): Collection
    {
        $budgets = $user->budgets()
            ->with('category')
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->sortBy(fn (Budget $b) => $b->category->name)
            ->values();

        if ($budgets->isEmpty()) {
            return $budgets;
        }

        $used = $this->transactions
            ->query($user, Period::month($year, $month), ['type' => 'expense'])
            ->whereIn('category_id', $budgets->pluck('category_id'))
            ->toBase()
            ->selectRaw('category_id, SUM(amount) AS total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        return $budgets->each(fn (Budget $b) => $b->setAttribute('used', Money::of($used[$b->category_id] ?? 0)));
    }

    /**
     * @return array{amount: float, used: float, remaining: float}
     */
    public function totals(Collection $budgets): array
    {
        $amount = Money::of($budgets->sum(fn ($b) => (float) $b->amount));
        $used = Money::of($budgets->sum(fn ($b) => (float) $b->used));

        return [
            'amount' => $amount,
            'used' => $used,
            'remaining' => Money::of($amount - $used),
        ];
    }

    /**
     * Isi atribut `used` untuk satu budget (setelah create/update).
     */
    public function withUsage(User $user, Budget $budget): Budget
    {
        $used = $this->transactions
            ->query($user, Period::month($budget->year, $budget->month), ['type' => 'expense'])
            ->where('category_id', $budget->category_id)
            ->sum('amount');

        return $budget->load('category')->setAttribute('used', Money::of($used));
    }
}
