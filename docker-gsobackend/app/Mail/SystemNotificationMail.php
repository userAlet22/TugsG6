<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SystemNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $notification;

    /**
     * Create a new message instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('GSO System Update: ' . str_replace('_', ' ', ucfirst($this->notification->type)))
                    ->view('emails.system_notification');
    }
}
