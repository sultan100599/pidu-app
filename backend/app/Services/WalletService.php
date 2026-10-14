<?php

namespace App\Services;

use App\Models\Transfer;
use App\Models\User;
use App\Models\Wallet;
use App\Support\Money;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Dompet bawaan: dompet aktif tertua. User tanpa dompet sama sekali dibuatkan "Dompet Utama".
     */
    public function primaryFor(User $user): Wallet
    {
        return $user->wallets()->where('is_active', true)->orderBy('id')->first()
            ?? $user->wallets()->orderBy('id')->first()
            ?? $user->wallets()->create([
                'name' => Wallet::DEFAULT_NAME,
                'kind' => 'cash',
                'purpose' => 'personal',
                'opening_balance' => $user->opening_balance ?? 0,
            ]);
    }

    /**
     * Dompet user (aktif dulu, lalu urutan dibuat) dengan saldo per hari ini di atribut `balance`.
     * Saldo = saldo awal + pemasukan - pengeluaran + uang masuk - uang keluar (pindah dompet).
     * Transaksi dan pindahan bertanggal masa depan belum dihitung.
     *
     * @param  array{purpose?: string, wallet_id?: int}  $filters
     * @return Collection<int, Wallet>
     */
    public function withBalances(User $user, array $filters = []): Collection
    {
        $today = now()->toDateString();
        $wallets = $user->wallets()
            ->when($filters['purpose'] ?? null, fn ($q, $purpose) => $q->where('purpose', $purpose))
            ->when($filters['wallet_id'] ?? null, fn ($q, $id) => $q->whereKey($id))
            ->orderByDesc('is_active')
            ->orderBy('id')
            ->get();
        if ($wallets->isEmpty()) {
            return $wallets;
        }

        $ids = $wallets->modelKeys();
        $net = DB::table('transactions')
            ->whereIn('wallet_id', $ids)
            ->where('transaction_date', '<=', $today)
            ->groupBy('wallet_id')
            ->selectRaw("wallet_id, COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net")
            ->pluck('net', 'wallet_id');
        $in = $this->transferSums($ids, 'to_wallet_id', $today);
        $out = $this->transferSums($ids, 'from_wallet_id', $today);

        return $wallets->each(fn (Wallet $wallet) => $wallet->setAttribute('balance', Money::of(
            (float) $wallet->opening_balance
            + (float) ($net[$wallet->id] ?? 0)
            + (float) ($in[$wallet->id] ?? 0)
            - (float) ($out[$wallet->id] ?? 0)
        )));
    }

    /**
     * Isi kartu "Uang kamu sekarang" di dashboard.
     *
     * @return array{current_balance: float, opening_balance: float|null, wallets: list<array>}
     */
    public function summary(User $user, array $filters = []): array
    {
        $wallets = $this->withBalances($user, $filters);

        return [
            'current_balance' => Money::of($wallets->sum('balance')),
            // null = user belum pernah ditanya saldo awal (dashboard menampilkan pertanyaannya).
            'opening_balance' => $user->opening_balance === null ? null : Money::of($wallets->sum('opening_balance')),
            'wallets' => $wallets
                ->filter(fn (Wallet $w) => $w->is_active || $w->balance != 0)
                ->map(fn (Wallet $w) => [
                    'id' => $w->id,
                    'name' => $w->name,
                    'kind' => $w->kind->value,
                    'purpose' => $w->purpose->value,
                    'balance' => $w->balance,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * Saldo awal dari pertanyaan pertama di dashboard masuk ke dompet utama.
     */
    public function setOpeningBalance(User $user, float $amount): void
    {
        $this->primaryFor($user)->update(['opening_balance' => $amount]);
    }

    public function isUsed(Wallet $wallet): bool
    {
        return $wallet->transactions()->exists()
            || $wallet->transfersOut()->exists()
            || $wallet->transfersIn()->exists()
            || $wallet->recurringTransactions()->exists();
    }

    public function transfer(User $user, array $data): Transfer
    {
        return $user->transfers()->create($data)->load('fromWallet', 'toWallet');
    }

    private function transferSums(array $ids, string $column, string $today): Collection
    {
        return Transfer::query()
            ->whereIn($column, $ids)
            ->where('transfer_date', '<=', $today)
            ->groupBy($column)
            ->toBase()
            ->selectRaw("$column AS wallet, SUM(amount) AS total")
            ->pluck('total', 'wallet');
    }
}
