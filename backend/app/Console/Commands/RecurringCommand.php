<?php

namespace App\Console\Commands;

use App\Services\RecurringService;
use Illuminate\Console\Command;

class RecurringCommand extends Command
{
    protected $signature = 'pidu:recurring';

    protected $description = 'Buat transaksi rutin yang sudah jatuh tempo';

    public function handle(RecurringService $service): int
    {
        $count = $service->runDue();
        $this->info("$count transaksi rutin dibuat.");

        return self::SUCCESS;
    }
}
