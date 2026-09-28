<?php

namespace Database\Factories;

use App\Models\Budget;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category_id' => fn (array $attr) => Category::factory()->create(['user_id' => $attr['user_id']])->id,
            'month' => (int) now()->month,
            'year' => (int) now()->year,
            'amount' => 1_000_000,
        ];
    }
}
