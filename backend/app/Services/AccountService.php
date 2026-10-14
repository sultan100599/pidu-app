<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AccountService
{
    public function __construct(private BackupService $backups) {}

    /**
     * Hapus akun beserta semua datanya. Urutannya mengikuti foreign key yang menahan
     * (transaksi menahan dompet/kategori/rutin, rutin menahan dompet/kategori).
     */
    public function delete(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->transactions()->delete();
            $user->transfers()->delete();
            $user->recurringTransactions()->delete();
            $user->budgets()->delete();
            $user->wallets()->delete();
            $user->categories()->delete();
            $user->tokens()->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $user->delete();
        });

        File::deleteDirectory($this->backups->userDir($user));
    }
}
