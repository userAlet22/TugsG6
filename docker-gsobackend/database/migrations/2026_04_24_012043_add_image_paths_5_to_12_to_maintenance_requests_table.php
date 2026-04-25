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
            $table->string('image_path_5')->nullable()->after('image_path_4');
            $table->string('image_path_6')->nullable()->after('image_path_5');
            $table->string('image_path_7')->nullable()->after('image_path_6');
            $table->string('image_path_8')->nullable()->after('image_path_7');
            $table->string('image_path_9')->nullable()->after('image_path_8');
            $table->string('image_path_10')->nullable()->after('image_path_9');
            $table->string('image_path_11')->nullable()->after('image_path_10');
            $table->string('image_path_12')->nullable()->after('image_path_11');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            $table->dropColumn([
                'image_path_5', 'image_path_6', 'image_path_7', 'image_path_8',
                'image_path_9', 'image_path_10', 'image_path_11', 'image_path_12'
            ]);
        });
    }
};
