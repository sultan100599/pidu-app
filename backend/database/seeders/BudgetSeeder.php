<?php

namespace Database\Seeders;

use App\Models\Budget;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class BudgetSeeder extends Seeder
{
    /**
     * Budget September 2026 untuk user demo.
     *
     * Nominal budget dihitung dari total pengeluaran aktual per kategori
     * di bulan tersebut (dari TransactionSeeder) dibagi rasio target,
     * sehingga terdapat kategori dengan status ok (<80%),
     * warning (80–99%), dan exceeded (>=100%).
     */
    public function run(): void
    {
        $demo = User::where('email', 'demo@pidu.test')->firstOrFail();

        if ($demo->budgets()->exists()) {
            return;
        }

        $categories = $demo->categories()->get()->keyBy('name');

        // rasio target: used / budget
        $plans = [
            'Makanan' => 0.70,      // ok
            'Transportasi' => 0.90, // warning
            'Hiburan' => 0.85,      // warning
            'Belanja' => 1.10,      // exceeded
            'Rokok' => 1.15,        // exceeded
        ];

        $start = '2026-09-01';
        $end = '2026-09-30';
        $now = now();
        $rows = [];

        foreach ($plans as $name => $ratio) {
            $used = (float) Transaction::query()
                ->where('user_id', $demo->id)
                ->where('category_id', $categories[$name]->id)
                ->whereBetween('transaction_date', [$start, $end])
                ->sum('amount');

            $budget = max(1000, (int) round(($used / $ratio) / 1000) * 1000);

            $rows[] = [
                'user_id' => $demo->id,
                'category_id' => $categories[$name]->id,
                'month' => 9,
                'year' => 2026,
                'amount' => $budget,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        Budget::insert($rows);
    }
}
