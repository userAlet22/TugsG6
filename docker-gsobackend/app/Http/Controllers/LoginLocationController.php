<?php

namespace App\Http\Controllers;

use App\Models\LoginLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginLocationController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Ensure Admin only
        if (!$user || $user->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized. Only Admins can view login locations.'], 403);
        }

        $logs = LoginLocation::with(['user' => function($query) {
                // Select specific fields to prevent sending unnecessary data
                $query->select('id', 'first_name', 'last_name', 'role_id');
            }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'account_name' => optional($log->user)->first_name . ' ' . optional($log->user)->last_name,
                    'role_id' => optional($log->user)->role_id,
                    'latitude' => $log->latitude,
                    'longitude' => $log->longitude,
                    'address' => $log->address,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json($logs);
    }
}
