<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'expense',
            // Kategori milik user yang sama dan jenis yang sama.
            'category_id' => fn (array $attr) => Category::factory()->create([
                'user_id' => $attr['user_id'],
                'type' => $attr['type'],
            ])->id,
            'transaction_date' => fake()->dateTimeBetween('-30 days')->format('Y-m-d'),
            'amount' => fake()->numberBetween(1, 500) * 1000,
            'payment_method' => 'cash',
            'description' => fake()->sentence(3),
            'notes' => null,
        ];
    }

    public function income(): static
    {
        return $this->state(['type' => 'income']);
    }
}
