<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\ResetPasswordMail;

class ForgotPasswordController extends Controller
{
    /**
     * Handle the request to send a password reset link.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
        ]);

        $identifier = $request->identifier;

        // Find user by email or username
        $user = User::where('email', $identifier)
                    ->orWhere('username', $identifier)
                    ->first();

        if ($user && $user->email) {
            // Generate a secure random token
            $token = Str::random(64);

            // Upsert the token in password_reset_tokens
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => $token,
                    'created_at' => Carbon::now()
                ]
            );

            // Send Email
            Mail::to($user->email)->send(new ResetPasswordMail($token));
        }

        // Always return 200 to prevent enumeration
        return response()->json([
            'message' => 'If an account with that identifier exists, a password reset email has been sent.'
        ], 200);
    }

    /**
     * Handle the password reset process.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $resetRecord = DB::table('password_reset_tokens')
                         ->where('token', $request->token)
                         ->first();

        // Verify token exists and is not expired (30 minutes window)
        if (!$resetRecord || Carbon::parse($resetRecord->created_at)->addMinutes(30)->isPast()) {
            return response()->json([
                'message' => 'Invalid or expired token.'
            ], 400);
        }

        // Find user by email associated with the token
        $user = User::where('email', $resetRecord->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid or expired token.'
            ], 400);
        }

        // Update the user's password
        $user->password = Hash::make($request->new_password);
        $user->save();

        // Invalidate or delete the token from the database so it cannot be reused
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return response()->json([
            'message' => 'Password has been successfully updated.'
        ], 200);
    }
}
