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
        Schema::create('sms_deliveries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notification_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('to_number')->nullable();
            $table->string('provider')->nullable(); // e.g. semaphore
            $table->string('status')->default('pending'); // pending, sent, failed, skipped
            $table->string('provider_message_id')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('notification_id')->references('id')->on('notifications')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_deliveries');
    }
};
