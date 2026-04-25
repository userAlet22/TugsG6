<?php

namespace App\Services\Sms\Providers;

use App\Services\Sms\Contracts\SmsProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PhilSmsProvider implements SmsProvider
{
    /**
     * Send an SMS via PhilSMS API v3.
     *
     * Required .env keys:
     *   PHILSMS_TOKEN    — API Token from dashboard.philsms.com/developers
     *   PHILSMS_SENDER   — Sender ID (default: PhilSMS — Globe only; register custom for Smart)
     *
     * @return array<string, mixed>
     */
    public function send(string $to, string $message, array $context = []): array
    {
        $token    = (string) config('sms.philsms_token', '');
        $senderId = (string) config('sms.philsms_sender', 'PhilSMS');

        if ($token === '') {
            throw new RuntimeException('PHILSMS_TOKEN is not configured in .env.');
        }

        // PhilSMS accepts numbers without the + sign (e.g. 639171234567)
        $recipient = ltrim($to, '+');

        $response = Http::withoutVerifying()
            ->withToken($token)
            ->acceptJson()
            ->timeout((int) config('sms.timeout_seconds', 15))
            ->post('https://dashboard.philsms.com/api/v3/sms/send', [
                'recipient' => $recipient,
                'sender_id' => $senderId,
                'type'      => 'plain',
                'message'   => $message,
            ]);

        $body = $response->json();

        // PhilSMS returns {"status":"success",...} on success
        if ($response->failed() || (isset($body['status']) && $body['status'] !== 'success')) {
            $errorMsg = $body['message'] ?? ('PhilSMS request failed with HTTP ' . $response->status() . '.');
            throw new RuntimeException($errorMsg);
        }

        return [
            'provider'            => 'philsms',
            'status'              => $response->status(),
            'provider_message_id' => $body['data']['uid'] ?? null,
            'body'                => $body,
        ];
    }
}
