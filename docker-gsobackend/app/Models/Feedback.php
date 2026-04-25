<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;
    protected $table = 'feedbacks';

    protected $fillable = [
        'user_id',
        'maintenance_request_id',
        'request_date',
        'client_type',
        'service_type',
        'date',
        'sex',
        'region',
        'age',
        'office_visited',
        'service_availed',
        'cc1', 'cc2', 'cc3',
        'sqd0', 'sqd1', 'sqd2', 'sqd3', 'sqd4', 'sqd5', 'sqd6', 'sqd7', 'sqd8',
        'suggestions',
        'email',
        'rating',
        'feedback_comment'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function maintenanceRequest()
    {
        return $this->belongsTo(MaintenanceRequest::class);
    }


}
