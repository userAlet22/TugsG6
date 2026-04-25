<?php

return [
    'enabled' => filter_var(env('EMAIL_NOTIFICATIONS_ENABLED', true), FILTER_VALIDATE_BOOL),
    'queue'   => filter_var(env('EMAIL_NOTIFICATIONS_QUEUE', true), FILTER_VALIDATE_BOOL),

    'allowed_types' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env(
            'EMAIL_ALLOWED_TYPES',
            'maintenance_request_approved_by_head,maintenance_request_approved_by_campus_director,maintenance_request_denied,maintenance_request_disapproved,maintenance_request_scheduled,maintenance_request_done,maintenance_request_completely_approved,account_request_rejected'
        ))
    ))),
];
