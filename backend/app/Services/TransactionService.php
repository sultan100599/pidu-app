<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Support\Money;
use App\Support\Period;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionService
{
    /**
     * Query dasar transaksi user, dipersempit periode (null = semua tanggal) dan filter.
     */
    public function query(User $user, ?Period $period = null, array $filters = []): HasMany|Builder
    {
        return $user->transactions()
            ->when($period, fn ($q) => $q->between($period->startDate(), $period->endDate()))
            ->filter($filters);
    }

    public function paginate(
        User $user,
        ?Period $period,
        array $filters,
        string $sort = 'transaction_date',
        string $dir = 'desc',
        int $perPage = 15,
    ): LengthAwarePaginator {
        return $this->query($user, $period, $filters)
            ->with('category', 'wallet')
            ->orderBy($sort, $dir)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Total income/expense/balance/count dalam satu query agregat.
     *
     * @return array{income: float, expense: float, balance: float, count: int}
     */
    public function totals(User $user, ?Period $period = null, array $filters = []): array
    {
        $row = $this->query($user, $period, $filters)
            ->toBase()
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income")
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense")
            ->selectRaw('COUNT(*) AS cnt')
            ->first();

        $income = Money::of($row->income);
        $expense = Money::of($row->expense);

        return [
            'income' => $income,
            'expense' => $expense,
            'balance' => Money::of($income - $expense),
            'count' => (int) $row->cnt,
        ];
    }

    /**
     * Agregat per kunci grup (mis. ekspresi DateSql) → [key => {income, expense, count}].
     *
     * @return array<string|int, array{income: float, expense: float, count: int}>
     */
    public function groupedTotals(User $user, ?Period $period, array $filters, string $groupExpr): array
    {
        return $this->query($user, $period, $filters)
            ->toBase()
            ->selectRaw("$groupExpr AS grp")
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income")
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense")
            ->selectRaw('COUNT(*) AS cnt')
            ->groupByRaw($groupExpr)
            ->get()
            ->mapWithKeys(fn ($r) => [(string) $r->grp => [
                'income' => Money::of($r->income),
                'expense' => Money::of($r->expense),
                'count' => (int) $r->cnt,
            ]])
            ->all();
    }

    public function create(User $user, array $data): Transaction
    {
        return $user->transactions()->create($data)->load('category', 'wallet');
    }

    public function update(Transaction $transaction, array $data): Transaction
    {
        $transaction->update($data);

        return $transaction->load('category', 'wallet');
    }

    public function delete(Transaction $transaction): void
    {
        $transaction->delete();
    }
}
