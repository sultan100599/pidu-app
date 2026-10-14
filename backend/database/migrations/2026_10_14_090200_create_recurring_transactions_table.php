<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Transaksi rutin (mis. listrik tiap tanggal 5). Jadwal ke-n dihitung dari start_date + n periode
     * (run_count), jadi tanggal 31 tidak bergeser setelah melewati Februari.
     */
    public function up(): void
    {
        Schema::create('recurring_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('wallet_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 15, 2)->unsigned();
            $table->enum('payment_method', ['cash', 'transfer', 'debit', 'credit_card', 'e_wallet', 'qris', 'other'])->default('cash');
            $table->string('description', 255)->nullable();
            $table->enum('frequency', ['monthly', 'weekly']);
            $table->date('start_date');
            $table->unsignedInteger('run_count')->default(0);
            $table->date('next_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'next_date']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('recurring_transaction_id')->nullable()->after('wallet_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_transaction_id');
        });
        Schema::dropIfExists('recurring_transactions');
    }
};
