<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hapus token login yang sudah kedaluwarsa > 24 jam (butuh `php artisan schedule:work` / cron).
Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Backup harian: snapshot SQLite + xlsx semua transaksi per user (lihat config/pidu.php).
Schedule::command('pidu:backup')->dailyAt(config('pidu.backup.time'))->withoutOverlapping();
