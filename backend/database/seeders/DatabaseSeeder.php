<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'demo@pidu.test'],
            ['name' => 'Demo User', 'password' => 'password']
        );

        User::updateOrCreate(
            ['email' => 'other@pidu.test'],
            ['name' => 'Other User', 'password' => 'password']
        );

        $this->call([
            CategorySeeder::class,
            TransactionSeeder::class,
            BudgetSeeder::class,
        ]);
    }
}
