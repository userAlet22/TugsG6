<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->date('scheduled_date')->nullable()->after('approved_at');
            $table->time('scheduled_time')->nullable()->after('scheduled_date');
            $table->foreignId('assigned_staff')
                  ->nullable()
                  ->after('scheduled_time')
                  ->constrained('users')
                  ->onDelete('set null');
            $table->text('scheduled_notes')->nullable()->after('assigned_staff');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_staff']);
            $table->dropColumn(['scheduled_date', 'scheduled_time', 'assigned_staff', 'scheduled_notes']);
        });
    }
};
