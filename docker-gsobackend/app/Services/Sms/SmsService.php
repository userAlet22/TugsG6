<?php

namespace App\Services\Sms;

use App\Models\Notification;
use App\Models\SmsDelivery;
use App\Services\Sms\Contracts\SmsProvider;
use App\Services\Sms\Providers\SemaphoreSmsProvider;
use App\Services\Sms\Providers\TwilioSmsProvider;
use App\Services\Sms\Providers\PhilSmsProvider;
use Illuminate\Support\Facades\Log;
use Throwable;

class SmsService
{
    public function sendForNotification(Notification $notification): void
    {
        if (!config('sms.enabled', false)) {
            return;
        }

        $allowedTypes = config('sms.allowed_types', []);
        if (is_array($allowedTypes) && !in_array($notification->type, $allowedTypes, true)) {
            return;
        }

        $user = $notification->user;

        $delivery = SmsDelivery::create([
            'notification_id' => $notification->id,
            'user_id' => $user->id ?? null,
            'status' => 'pending',
            'to_number' => $user ? $user->contact_number : null,
            'provider' => config('sms.provider', 'unknown')
        ]);

        if (!$user) {
            $delivery->update(['status' => 'skipped', 'error_message' => 'Notification has no recipient user.']);
            Log::warning('SMS skipped: notification has no recipient user.', ['notification_id' => $notification->id]);
            return;
        }

        $normalizedNumber = $this->normalizePhilippineNumber($user->contact_number);
        if (!$normalizedNumber) {
            $delivery->update(['status' => 'skipped', 'error_message' => 'Invalid recipient contact number.']);
            Log::warning('SMS skipped: invalid recipient contact number.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
            ]);
            return;
        }

        $delivery->update(['to_number' => $normalizedNumber]);

        $message = $this->buildMessage($notification->message);
        if ($message === '') {
            $delivery->update(['status' => 'skipped', 'error_message' => 'Empty message.']);
            Log::warning('SMS skipped: empty message.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
            ]);
            return;
        }

        if (config('sms.dry_run', true)) {
            $delivery->update([
                'status' => 'skipped',
                'error_message' => 'Dry run enabled, message not sent.'
            ]);
            Log::info('SMS dry run: message not sent to provider.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'type' => $notification->type,
                'to' => $normalizedNumber,
                'message' => $message,
            ]);
            return;
        }

        $provider = $this->resolveProvider();
        if (!$provider) {
            $delivery->update(['status' => 'failed', 'error_message' => 'Provider not available.']);
            Log::warning('SMS skipped: provider not available.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'provider' => config('sms.provider'),
            ]);
            return;
        }

        try {
            $result = $provider->send($normalizedNumber, $message, [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'type' => $notification->type,
            ]);

            $delivery->update([
                'status' => 'sent',
                'provider' => $result['provider'] ?? config('sms.provider'),
                'provider_message_id' => $result['status'] ?? null, // using status as provider_msg_id temporarily if real msg_id isn't returned
                'sent_at' => now(),
            ]);

            Log::info('SMS sent successfully.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'type' => $notification->type,
                'to' => $normalizedNumber,
                'provider' => $result['provider'] ?? config('sms.provider'),
                'provider_status' => $result['status'] ?? null,
            ]);
        } catch (Throwable $e) {
            $delivery->update([
                'status' => 'failed',
                'error_message' => mb_strimwidth($e->getMessage(), 0, 1000, '...')
            ]);

            Log::error('SMS sending failed.', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'type' => $notification->type,
                'provider' => config('sms.provider'),
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function normalizePhilippineNumber(?string $raw): ?string
    {
        if (!$raw) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $raw);
        if (!$digits) {
            return null;
        }

        // 09171234567 -> 639171234567
        if (strlen($digits) === 11 && str_starts_with($digits, '0')) {
            return '63'.substr($digits, 1);
        }

        // 9171234567 -> 639171234567
        if (strlen($digits) === 10 && str_starts_with($digits, '9')) {
            return '63'.$digits;
        }

        // Already in international format without "+"
        if (strlen($digits) === 12 && str_starts_with($digits, '63')) {
            return $digits;
        }

        return null;
    }

    private function buildMessage(string $message): string
    {
        $prefix = trim((string) config('sms.message_prefix', ''));
        $body = trim($message);
        if ($body === '') {
            return '';
        }

        $text = $prefix !== '' ? $prefix.' '.$body : $body;

        // Keep payload concise to reduce SMS segment multiplication in PH billing.
        return mb_strimwidth($text, 0, 480, '...');
    }

    private function resolveProvider(): ?SmsProvider
    {
        $provider = strtolower((string) config('sms.provider', ''));

        return match ($provider) {
            'semaphore' => app(SemaphoreSmsProvider::class),
            'twilio'    => app(TwilioSmsProvider::class),
            'philsms'   => app(PhilSmsProvider::class),
            default     => null,
        };
    }
}
