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
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->string('image_path_2')->nullable()->after('image_path');
            $table->string('image_path_3')->nullable()->after('image_path_2');
            $table->string('image_path_4')->nullable()->after('image_path_3');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropColumn(['image_path_2', 'image_path_3', 'image_path_4']);
        });
    }
};
