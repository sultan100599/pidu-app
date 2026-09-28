<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->date('transaction_date');
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 15, 2)->unsigned();
            $table->enum('payment_method', ['cash', 'transfer', 'debit', 'credit_card', 'e_wallet', 'qris', 'other'])->default('cash');
            $table->string('description', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('transaction_date');
            $table->index('type');
            $table->index('category_id');
            $table->index('payment_method');
            $table->index(['user_id', 'transaction_date']);
            $table->index(['user_id', 'type', 'transaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
