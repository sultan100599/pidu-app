<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => ucfirst(fake()->unique()->word()).' '.fake()->unique()->numberBetween(1, 99999),
            'type' => 'expense',
            'icon' => 'bi-tag',
            'color' => '#6c757d',
            'is_active' => true,
        ];
    }

    public function income(): static
    {
        return $this->state(['type' => 'income']);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
