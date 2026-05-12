<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'position_id',
        'office_id',
        'status_id',
        'role_id',
        'contact_number',
        'email',
        'username',
        'password',
        'expo_push_token',
        'google_id',
        'google_avatar',
        'auth_provider',
    ];

    // Relationships
    public function position() { return $this->belongsTo(Position::class); }
    public function office() { return $this->belongsTo(Office::class); }
    public function status() { return $this->belongsTo(Status::class); }
    public function role() { return $this->belongsTo(Role::class); }
    public function loginLocations() { return $this->hasMany(LoginLocation::class); }
}


