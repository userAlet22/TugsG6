<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'Scheduled' status (will become status_id = 9)
        DB::table('statuses')->insertOrIgnore([
            ['name' => 'Scheduled'],
        ]);

        // Add unique constraint to prevent duplicate feedback per request
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->unique('maintenance_request_id', 'feedbacks_maintenance_request_id_unique');
        });
    }

    public function down(): void
    {
        DB::table('statuses')->where('name', 'Scheduled')->delete();

        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropUnique('feedbacks_maintenance_request_id_unique');
        });
    }
};
