<?php

return [
    'enabled'         => filter_var(env('SMS_ENABLED', false), FILTER_VALIDATE_BOOL),
    'provider'        => env('SMS_PROVIDER', 'semaphore'),
    'dry_run'         => filter_var(env('SMS_DRY_RUN', true), FILTER_VALIDATE_BOOL),
    'queue'           => filter_var(env('SMS_QUEUE', true), FILTER_VALIDATE_BOOL),
    'sender_name'     => env('SMS_SENDER_NAME'),
    'api_key'         => env('SMS_API_KEY'),
    'message_prefix'  => env('SMS_MESSAGE_PREFIX', '[GS-JS]'),
    'timeout_seconds' => (int) env('SMS_TIMEOUT_SECONDS', 15),

    // Twilio-specific
    'twilio_sid'        => env('TWILIO_SID'),
    'twilio_auth_token' => env('TWILIO_AUTH_TOKEN'),
    'twilio_from'       => env('TWILIO_FROM'),

    // PhilSMS-specific
    'philsms_token'  => env('PHILSMS_TOKEN'),
    'philsms_sender' => env('PHILSMS_SENDER', 'PhilSMS'),

    'allowed_types' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env(
            'SMS_ALLOWED_TYPES',
            'maintenance_request_approved_by_head,maintenance_request_approved_by_campus_director,maintenance_request_denied,maintenance_request_disapproved,maintenance_request_scheduled,maintenance_request_done,maintenance_request_completely_approved,account_request_rejected'
        ))
    ))),
];
