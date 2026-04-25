<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushTokenController extends Controller
{
    /**
     * Store the Expo Push Token for the authenticated user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'expo_push_token' => 'required|string'
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->update([
            'expo_push_token' => $request->expo_push_token
        ]);

        return response()->json([
            'message' => 'Push token successfully updated.'
        ], 200);
    }
}
