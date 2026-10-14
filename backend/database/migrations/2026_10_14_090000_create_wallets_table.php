<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dompet (tunai, rekening, e-wallet) bertanda Pribadi/Usaha. Setiap user lama mendapat
     * "Dompet Utama" berisi saldo awalnya, dan semua transaksi lamanya dipindah ke sana.
     */
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->enum('kind', ['cash', 'bank', 'e_wallet'])->default('cash');
            $table->enum('purpose', ['personal', 'business'])->default('personal');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'name']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('wallet_id')->nullable()->after('category_id')->constrained()->restrictOnDelete();
            $table->index(['user_id', 'wallet_id']);
        });

        $now = now();
        foreach (DB::table('users')->select('id', 'opening_balance')->orderBy('id')->cursor() as $user) {
            $walletId = DB::table('wallets')->insertGetId([
                'user_id' => $user->id,
                'name' => 'Dompet Utama',
                'kind' => 'cash',
                'purpose' => 'personal',
                'opening_balance' => $user->opening_balance ?? 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('transactions')->where('user_id', $user->id)->update(['wallet_id' => $walletId]);
        }
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'wallet_id']);
            $table->dropConstrainedForeignId('wallet_id');
        });
        Schema::dropIfExists('wallets');
    }
};
