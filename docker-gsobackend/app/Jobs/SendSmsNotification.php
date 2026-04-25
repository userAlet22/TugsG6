<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Services\Sms\SmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendSmsNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var int[]
     */
    public array $backoff = [60, 300, 900];

    public function __construct(public int $notificationId)
    {
    }

    public function handle(SmsService $smsService): void
    {
        $notification = Notification::with('user')->find($this->notificationId);
        if (!$notification) {
            Log::warning('SMS job skipped: notification no longer exists.', [
                'notification_id' => $this->notificationId,
            ]);
            return;
        }

        $smsService->sendForNotification($notification);
    }

    public function failed(Throwable $exception): void
    {
        Log::error('SMS job permanently failed.', [
            'notification_id' => $this->notificationId,
            'error' => $exception->getMessage(),
        ]);
    }
}
