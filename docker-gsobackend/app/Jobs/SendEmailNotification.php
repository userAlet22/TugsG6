<?php

namespace App\Jobs;

use App\Mail\SystemNotificationMail;
use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; #for msg queue
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendEmailNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $notificationId;

    /**
     * Create a new job instance.
     */
    public function __construct($notificationId)
    {
        $this->notificationId = $notificationId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $notification = Notification::with('user')->find($this->notificationId);

        if (!$notification) {
            Log::warning('Email Notification Job: Notification not found.', ['notification_id' => $this->notificationId]);
            return;
        }

        $user = $notification->user;

        if (!$user || !$user->email) {
            Log::warning('Email Notification Job: User or email not found.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id ?? null
            ]);
            return;
        }

        try {
            Mail::to($user->email)->send(new SystemNotificationMail($notification));

            Log::info('Email notification sent successfully.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'email' => $user->email,
                'type' => $notification->type
            ]);
        } catch (Throwable $e) {
            Log::error('Email notification sending failed.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }
}
