<?php

namespace App\Services;

use App\Models\RecurringTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class RecurringService
{
    /** Pengaman: satu aturan tidak membuat lebih dari ini dalam sekali jalan. */
    private const MAX_PER_RUN = 400;

    /**
     * Buat semua transaksi yang sudah jatuh tempo (sampai hari ini), termasuk yang terlewat
     * saat aplikasi mati. Mengembalikan jumlah transaksi yang dibuat.
     */
    public function runDue(?User $user = null, ?CarbonImmutable $today = null): int
    {
        $today ??= CarbonImmutable::today();
        $created = 0;

        RecurringTransaction::query()
            ->where('is_active', true)
            ->where('next_date', '<=', $today->toDateString())
            ->when($user, fn ($q) => $q->where('user_id', $user->id))
            ->orderBy('id')
            ->each(function (RecurringTransaction $rule) use ($today, &$created) {
                $created += $this->run($rule, $today);
            });

        return $created;
    }

    public function run(RecurringTransaction $rule, ?CarbonImmutable $today = null): int
    {
        $today ??= CarbonImmutable::today();

        return DB::transaction(function () use ($rule, $today) {
            $rule->refresh();
            $created = 0;
            while ($rule->is_active && $rule->next_date->lte($today) && $created < self::MAX_PER_RUN) {
                $rule->user->transactions()->create([
                    'category_id' => $rule->category_id,
                    'wallet_id' => $rule->wallet_id,
                    'recurring_transaction_id' => $rule->id,
                    'transaction_date' => $rule->next_date->toDateString(),
                    'type' => $rule->type->value,
                    'amount' => $rule->amount,
                    'payment_method' => $rule->payment_method->value,
                    'description' => $rule->description,
                    'notes' => $rule->notes,
                ]);
                $rule->run_count++;
                $rule->next_date = $rule->occurrence($rule->run_count);
                $created++;
            }
            $rule->save();

            return $created;
        });
    }

    /**
     * Aktif lagi setelah dijeda: jadwal yang terlewat selama jeda dilewati, bukan dibuat semua.
     */
    public function resume(RecurringTransaction $rule, ?CarbonImmutable $today = null): void
    {
        $today ??= CarbonImmutable::today();
        $runs = $rule->run_count;
        while ($rule->occurrence($runs)->lt($today)) {
            $runs++;
        }
        $rule->fill(['is_active' => true, 'run_count' => $runs, 'next_date' => $rule->occurrence($runs)])->save();
    }
}
