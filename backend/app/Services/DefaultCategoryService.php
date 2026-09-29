<?php

namespace App\Services;

use App\Models\Category;
use App\Models\User;

class DefaultCategoryService
{
    private const INCOME = [
        ['name' => 'Gaji', 'icon' => 'bi-cash-stack', 'color' => '#198754'],
        ['name' => 'Bonus', 'icon' => 'bi-gift', 'color' => '#20c997'],
        ['name' => 'Freelance', 'icon' => 'bi-laptop', 'color' => '#0d6efd'],
        ['name' => 'Bisnis', 'icon' => 'bi-briefcase', 'color' => '#6f42c1'],
        ['name' => 'Investasi', 'icon' => 'bi-graph-up-arrow', 'color' => '#fd7e14'],
        ['name' => 'Hadiah', 'icon' => 'bi-box-seam', 'color' => '#d63384'],
        ['name' => 'Lainnya', 'icon' => 'bi-three-dots', 'color' => '#6c757d'],
    ];

    private const EXPENSE = [
        ['name' => 'Makanan', 'icon' => 'bi-cup-hot', 'color' => '#dc3545'],
        ['name' => 'Transportasi', 'icon' => 'bi-car-front', 'color' => '#0d6efd'],
        ['name' => 'Belanja', 'icon' => 'bi-bag', 'color' => '#6f42c1'],
        ['name' => 'Tagihan', 'icon' => 'bi-receipt', 'color' => '#fd7e14'],
        ['name' => 'Listrik', 'icon' => 'bi-lightning-charge', 'color' => '#b8860b'],
        ['name' => 'Internet', 'icon' => 'bi-wifi', 'color' => '#20c997'],
        ['name' => 'Pulsa', 'icon' => 'bi-phone', 'color' => '#0dcaf0'],
        ['name' => 'Rumah Tangga', 'icon' => 'bi-house', 'color' => '#795548'],
        ['name' => 'Anak', 'icon' => 'bi-emoji-smile', 'color' => '#d63384'],
        ['name' => 'Kesehatan', 'icon' => 'bi-heart-pulse', 'color' => '#dc3545'],
        ['name' => 'Pendidikan', 'icon' => 'bi-mortarboard', 'color' => '#0d6efd'],
        ['name' => 'Hiburan', 'icon' => 'bi-film', 'color' => '#6f42c1'],
        ['name' => 'Rokok', 'icon' => 'bi-wind', 'color' => '#6c757d'],
        ['name' => 'Perjalanan', 'icon' => 'bi-airplane', 'color' => '#20c997'],
        ['name' => 'Lainnya', 'icon' => 'bi-three-dots', 'color' => '#adb5bd'],
    ];

    /**
     * Buat kategori default untuk user; lewati kategori yang sudah ada.
     */
    public function createFor(User $user): void
    {
        if ($user->categories()->exists()) {
            return;
        }

        $now = now();
        $rows = [];

        foreach ([self::INCOME, self::EXPENSE] as $i => $list) {
            $type = $i === 0 ? 'income' : 'expense';

            foreach ($list as $c) {
                $rows[] = [
                    'user_id' => $user->id,
                    'name' => $c['name'],
                    'type' => $type,
                    'icon' => $c['icon'],
                    'color' => $c['color'],
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            Category::insert($chunk);
        }
    }
}
