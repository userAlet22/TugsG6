<?php

namespace Tests\Unit;

use App\Services\Sms\SmsService;
use PHPUnit\Framework\TestCase;

class SmsServiceTest extends TestCase
{
    public function test_normalize_ph_number_from_local_format(): void
    {
        $service = new SmsService();

        $this->assertSame('639171234567', $service->normalizePhilippineNumber('0917-123-4567'));
    }

    public function test_normalize_ph_number_from_international_format(): void
    {
        $service = new SmsService();

        $this->assertSame('639171234567', $service->normalizePhilippineNumber('+63 917 123 4567'));
    }

    public function test_normalize_ph_number_rejects_invalid_value(): void
    {
        $service = new SmsService();

        $this->assertNull($service->normalizePhilippineNumber('12345'));
    }
}
