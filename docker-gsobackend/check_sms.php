<?php

$deliveries = App\Models\SmsDelivery::with('user')
    ->where('provider', 'philsms')
    ->latest()
    ->take(6)
    ->get();

foreach ($deliveries as $d) {
    $name = $d->user ? $d->user->first_name . ' ' . $d->user->last_name : 'Unknown User';
    echo "ID: {$d->id} | User: {$name} | Target Num: {$d->to_number} | Status: {$d->status} | Error: {$d->error_message}\n";
}
