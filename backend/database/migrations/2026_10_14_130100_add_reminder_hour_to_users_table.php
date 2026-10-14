<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Jam mulai banner pengingat di Ringkasan; null = pengingat mati.
            $table->unsignedTinyInteger('reminder_hour')->nullable()->default(17)->after('opening_balance');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('reminder_hour');
        });
    }
};
