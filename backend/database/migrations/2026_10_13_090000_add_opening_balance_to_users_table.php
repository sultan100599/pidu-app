<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // NULL = user belum pernah ditanya saldo awal (dashboard menampilkan pertanyaannya).
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('opening_balance', 15, 2)->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('opening_balance');
        });
    }
};
