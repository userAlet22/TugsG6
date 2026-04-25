<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsDelivery extends Model
{
    protected $fillable = [
        'notification_id',
        'user_id',
        'to_number',
        'provider',
        'status',
        'provider_message_id',
        'error_message',
        'sent_at'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function notification()
    {
        return $this->belongsTo(Notification::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
