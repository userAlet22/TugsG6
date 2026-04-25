<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SystemSettingController extends Controller
{
    public function getSettings()
    {
        $setting = SystemSetting::firstOrCreate(
            ['setting_key' => 'track_login_locations'],
            ['setting_value' => 'false']
        );

        return response()->json([
            'track_login_locations' => $setting->setting_value === 'true'
        ]);
    }

    public function toggleLoginLocationTracking(Request $request)
    {
        $user = Auth::user();
        
        // Ensure Admin only
        if (!$user || $user->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized. Only Admins can change settings.'], 403);
        }

        $request->validate([
            'track_login_locations' => 'required|boolean'
        ]);

        $setting = SystemSetting::firstOrCreate(
            ['setting_key' => 'track_login_locations'],
            ['setting_value' => 'false']
        );

        $setting->update([
            'setting_value' => $request->track_login_locations ? 'true' : 'false'
        ]);

        return response()->json([
            'message' => 'Setting updated successfully.',
            'track_login_locations' => $setting->setting_value === 'true'
        ]);
    }
}
