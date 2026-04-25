<?php

namespace App\Models;

use App\Jobs\SendSmsNotification;
use App\Services\Sms\SmsService;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'reference_id', 'type', 'message', 'is_read'];

    protected static function booted()
    {
        static::created(function ($notification) {
            $user = \App\Models\User::find($notification->user_id);
            if ($user) {
                $notification->setRelation('user', $user);
            }

            if ($user && $user->expo_push_token) {
                // Send synchronously to Expo API (withoutVerifying fixes cURL error 60 on local Windows machines)
                \Illuminate\Support\Facades\Http::withoutVerifying()->post('https://exp.host/--/api/v2/push/send', [
                    'to' => $user->expo_push_token,
                    'title' => 'GS-JS System Update Notification',
                    'body' => $notification->message,
                    'data' => [
                        'type' => $notification->type,
                        'reference_id' => $notification->reference_id,
                    ],
                ]);
            }

            if (config('sms.enabled', false)) {
                if (config('sms.queue', true)) {
                    SendSmsNotification::dispatch($notification->id);
                } else {
                    app(SmsService::class)->sendForNotification($notification);
                }
            }

            // Email Notifications
            if (config('email_notifications.enabled', false)) {
                $allowedTypes = config('email_notifications.allowed_types', []);
                if (in_array($notification->type, $allowedTypes, true)) {
                    if (config('email_notifications.queue', true)) {
                        \App\Jobs\SendEmailNotification::dispatch($notification->id);
                    } else {
                        (new \App\Jobs\SendEmailNotification($notification->id))->handle();
                    }
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
