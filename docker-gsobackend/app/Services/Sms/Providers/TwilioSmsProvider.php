<?php

namespace App\Services\Sms\Providers;

use App\Services\Sms\Contracts\SmsProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class TwilioSmsProvider implements SmsProvider
{
    /**
     * Send an SMS via Twilio REST API.
     *
     * Required .env keys:
     *   TWILIO_SID       — Account SID (starts with AC...)
     *   TWILIO_AUTH_TOKEN — Auth Token from Twilio Console
     *   TWILIO_FROM      — Your Twilio phone number (e.g. +15xxxxxxxxxx)
     *
     * @return array<string, mixed>
     */
    public function send(string $to, string $message, array $context = []): array
    {
        $sid   = (string) config('sms.twilio_sid', '');
        $token = (string) config('sms.twilio_auth_token', '');
        $from  = (string) config('sms.twilio_from', '');

        if ($sid === '' || $token === '' || $from === '') {
            throw new RuntimeException(
                'Twilio credentials are not fully configured. Please set TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM in .env.'
            );
        }

        // Twilio requires the number in E.164 format e.g. +639171234567
        $toE164 = '+' . ltrim($to, '+');

        $response = Http::withBasicAuth($sid, $token)
            ->timeout((int) config('sms.timeout_seconds', 15))
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $from,
                'To'   => $toE164,
                'Body' => $message,
            ]);

        $body = $response->json();

        if ($response->failed() || isset($body['code'])) {
            $errorMsg = $body['message'] ?? ('Twilio SMS request failed with status ' . $response->status() . '.');
            throw new RuntimeException($errorMsg);
        }

        return [
            'provider'           => 'twilio',
            'status'             => $response->status(),
            'provider_message_id'=> $body['sid'] ?? null,
            'body'               => $body,
        ];
    }
}
