<?php

namespace App\Services\Sms\Providers;

use App\Services\Sms\Contracts\SmsProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SemaphoreSmsProvider implements SmsProvider
{
    /**
     * @return array<string, mixed>
     */
    public function send(string $to, string $message, array $context = []): array
    {
        $apiKey = (string) config('sms.api_key');
        if ($apiKey === '') {
            throw new RuntimeException('SMS_API_KEY is not configured for Semaphore.');
        }

        $payload = [
            'apikey' => $apiKey,
            'number' => $to,
            'message' => $message,
        ];

        $senderName = trim((string) config('sms.sender_name', ''));
        if ($senderName !== '') {
            $payload['sendername'] = $senderName;
        }

        $response = Http::asForm()
            ->timeout((int) config('sms.timeout_seconds', 15))
            ->post('https://api.semaphore.co/api/v4/messages', $payload);

        if ($response->failed()) {
            throw new RuntimeException('Semaphore SMS request failed with status '.$response->status().'.');
        }

        return [
            'provider' => 'semaphore',
            'status' => $response->status(),
            'body' => $response->json(),
        ];
    }
}
