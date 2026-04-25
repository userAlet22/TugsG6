<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    use HasFactory;
    protected $fillable = [
        'date_requested',
        'details',
        'requesting_personnel', // will become a user_id (foreign key)
        'position_id',
        'requesting_office',
        'contact_number',
        'status_id',
        'date_received',
        'time_received',
        'priority_number', // now a string
        'remarks',
        'verified_by',
        'approved_by_1',
        'approved_by_2',
        'maintenance_type_id',
        'image_path',
        'image_path_2',
        'image_path_3',
        'image_path_4',
        'image_path_5',
        'image_path_6',
        'image_path_7',
        'image_path_8',
        'image_path_9',
        'image_path_10',
        'image_path_11',
        'image_path_12',
        'scheduled_date',
        'scheduled_time',
        'assigned_staff',
        'scheduled_notes',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requesting_personnel');
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class, 'requesting_office');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function approver1()
    {
        return $this->belongsTo(User::class, 'approved_by_1');
    }

    public function approver2()
    {
        return $this->belongsTo(User::class, 'approved_by_2');
    }

    public function maintenanceType()
    {
        return $this->belongsTo(MaintenanceType::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'request_id');
    }

    public function scheduleEvent()
    {
        return $this->hasOne(ScheduleEvent::class, 'maintenance_request_id');
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class, 'maintenance_request_id');
    }

}
