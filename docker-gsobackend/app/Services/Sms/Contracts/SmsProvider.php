<?php

namespace App\Services\Sms\Contracts;

interface SmsProvider
{
    /**
     * @return array<string, mixed>
     */
    public function send(string $to, string $message, array $context = []): array;
}
