<?php

namespace App\Http\Controllers;

use App\Models\User;

use App\Models\Notification as SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Notifications\NewUserRegistered;

class GoogleAuthController extends Controller
{
    /**
     * Scenario 1, 2, 3: Verify Google ID Token from Frontend
     */
    public function verifyGoogleToken(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            // Get the Google driver
            $driver = Socialite::driver('google');

            // Fix for Local Development: cURL error 60 (SSL Certificate issue on Windows/XAMPP)
            if (app()->environment('local')) {
                $driver->setHttpClient(new \GuzzleHttp\Client(['verify' => false]));
            }

            // Verify the token with Google via Socialite
            $googleUser = $driver->userFromToken($request->id_token);
            
            $googleId = $googleUser->getId();
            $email = $googleUser->getEmail();
            
            // Step 5: Search by google_id first
            $userByGoogleId = User::where('google_id', $googleId)->first();
            
            if ($userByGoogleId) {
                return $this->authenticateUser($userByGoogleId);
            }

            // Step 6: Search by email
            $userByEmail = User::where('email', $email)->first();
            
            if ($userByEmail) {
                // Link google_id to existing account
                $userByEmail->update([
                    'google_id' => $googleId,
                    'google_avatar' => $googleUser->getAvatar(),
                ]);
                return $this->authenticateUser($userByEmail);
            }

            // Outcome B: Registration Required
            return response()->json([
                'status' => 'registration_required',
                'google_data' => [
                    'google_id' => $googleId,
                    'email' => $email,
                    'first_name' => $googleUser->user['given_name'] ?? '',
                    'last_name' => $googleUser->user['family_name'] ?? '',
                    'avatar' => $googleUser->getAvatar(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid Google token: ' . $e->getMessage()], 401);
        }
    }

    private function authenticateUser($user)
    {
        // Check status (reuse UserController logic)
        if ($user->status_id == 1) { // 1 = Pending
            return response()->json(['message' => 'Your account is still pending approval.'], 403);
        }

        if ($user->status_id == 3) { // 3 = Disapproved
            $message = 'Your account was disapproved.';
            if ($user->rejection_reason) {
                $message .= ' Reason: ' . $user->rejection_reason;
            }
            return response()->json(['message' => $message], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;
        return response()->json([
            'status' => 'authenticated',
            'token' => $token,
            'user' => $user
        ], 200);
    }

    /**
     * Scenario 2: Real-time username check and suggestion
     */
    public function checkUsernameAvailability(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
        ]);

        $originalUsername = $request->username;
        $username = $originalUsername;
        $available = !User::where('username', $username)->exists();

        if ($available) {
            return response()->json([
                'available' => true,
                'username' => $username,
                'suggested' => $username,
                'message' => null
            ]);
        }

        // Generate suggestion
        $count = 1;
        while (User::where('username', $originalUsername . $count)->exists()) {
            $count++;
        }
        $suggestion = $originalUsername . $count;

        return response()->json([
            'available' => false,
            'username' => $originalUsername,
            'suggested' => $suggestion,
            'message' => "The username '{$originalUsername}' is already taken. We suggest '{$suggestion}'."
        ]);
    }

    /**
     * Scenario 2: Submit Google registration form
     */
    public function registerWithGoogle(Request $request)
    {
        $request->validate([
            'google_id'      => 'required|string|unique:users,google_id',
            'email'          => 'required|email|unique:users,email',
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'required|string|max:255',
            'middle_name'    => 'nullable|string|max:1',
            'suffix'         => 'nullable|string|max:10',
            'contact_number' => 'required|string|max:20',
            'username'       => 'required|string|unique:users,username',
            'password'       => 'required|string|min:6|confirmed',
            'office_id'      => 'required|exists:offices,id',
            'position_id'    => 'required|exists:positions,id',
            'role_id'        => 'required|exists:roles,id',
            'avatar'         => 'nullable|string',
        ]);

        $user = User::create([
            'last_name'      => $request->last_name,
            'first_name'     => $request->first_name,
            'middle_name'    => $request->middle_name,
            'suffix'         => $request->suffix,
            'username'       => $request->username,
            'email'          => $request->email,
            'position_id'    => $request->position_id,
            'office_id'      => $request->office_id,
            'contact_number' => $request->contact_number,
            'password'       => Hash::make($request->password),
            'role_id'        => $request->role_id,
            'google_id'      => $request->google_id,
            'google_avatar'  => $request->avatar,
            'auth_provider'  => 'google',
            'status_id'      => 1, // Pending
        ]);

        // Notify Admins and Staffs (role_id = 1 for Admin, 3 for Staff)
        $adminsAndStaffs = User::whereIn('role_id', [1, 3])->get();
        foreach ($adminsAndStaffs as $notifiableUser) {
            if ($notifiableUser->email) {
                $notifiableUser->notify(new NewUserRegistered($user));
            }
        }

        $adminUsers = User::where('role_id', 1)->get();
        foreach ($adminUsers as $admin) {
            SystemNotification::create([
                'user_id' => $admin->id,
                'reference_id' => $user->id,
                'type' => 'account_request_created',
                'message' =>  $user->first_name . ' ' . $user->last_name  . ' registered an account (Google) and is waiting for approval.',
                'is_read' => false,
            ]);
        }

        return response()->json(['message' => 'User registered successfully via Google'], 201);
    }


}
