<?php

use App\Services\DefaultCategoryService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Kategori default yang ditambahkan di Phase 15 juga diberikan ke user lama,
    // kecuali user itu sudah punya kategori dengan nama dan jenis yang sama.
    public function up(): void
    {
        $now = now();

        foreach (DB::table('users')->pluck('id') as $userId) {
            $existing = DB::table('categories')->where('user_id', $userId)
                ->get(['name', 'type'])
                ->map(fn ($c) => $c->type.'|'.mb_strtolower($c->name))
                ->all();

            $rows = [];
            foreach (DefaultCategoryService::ADDED_IN_PHASE_15 as $type => $list) {
                foreach ($list as $c) {
                    if (in_array($type.'|'.mb_strtolower($c['name']), $existing, true)) {
                        continue;
                    }
                    $rows[] = [
                        'user_id' => $userId, 'name' => $c['name'], 'type' => $type,
                        'icon' => $c['icon'], 'color' => $c['color'], 'is_active' => true,
                        'created_at' => $now, 'updated_at' => $now,
                    ];
                }
            }
            if ($rows) {
                DB::table('categories')->insert($rows);
            }
        }
    }

    public function down(): void
    {
        // Data kategori milik user tidak dihapus otomatis.
    }
};
