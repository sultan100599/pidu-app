<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\BackupService;
use Illuminate\Console\Command;
use Throwable;

class BackupCommand extends Command
{
    protected $signature = 'pidu:backup {--user= : ID user tertentu saja (tanpa snapshot database)}';

    protected $description = 'Backup data Pidu-App: snapshot database (SQLite) + xlsx semua transaksi per user';

    public function handle(BackupService $backups): int
    {
        $userId = $this->option('user');
        $failed = false;

        if ($userId === null) {
            $snapshot = $backups->backupDatabase();
            $this->line($snapshot ? "Database → {$snapshot}" : 'Database: dilewati (bukan SQLite, gunakan backup bawaan database).');
        }

        $users = $userId === null ? User::query()->orderBy('id')->cursor() : User::whereKey($userId)->get();

        foreach ($users as $user) {
            try {
                $file = $backups->backupUser($user);
                $this->line("User #{$user->id} ({$user->email}) → {$file['name']}");
            } catch (Throwable $e) {
                // Satu user gagal jangan menghentikan backup user lain.
                report($e);
                $this->error("User #{$user->id}: gagal: {$e->getMessage()}");
                $failed = true;
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
