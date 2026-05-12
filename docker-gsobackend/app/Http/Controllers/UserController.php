<?php
namespace App\Http\Controllers;

use App\Models\MaintenanceType;
use Illuminate\Support\Facades\Auth;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Office;
use App\Models\Status;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Notifications\NewUserRegistered;
use App\Notifications\AccountApproved;
use App\Models\Notification as SystemNotification;
use App\Models\SystemSetting;
use App\Models\LoginLocation;


class UserController extends Controller
{
    // Register a new user
    public function register(Request $request)
    {
        $request->validate([
            'last_name'       => 'required|string',
            'first_name'      => 'required|string',
            'middle_name'  => 'nullable|string|max:1',
            'suffix'          => 'nullable|string|max:10',
            'username'        => 'required|string|unique:users,username',
            'email'          => 'nullable|email|unique:users,email',
            'position_id'     => 'required|exists:positions,id',
            'office_id'       => 'required|exists:offices,id',
            'contact_number'  => 'required|string',
            'password'        => 'required|string|min:6',
            'role_id'         => 'required|exists:roles,id'
        ]);

        $user = User::create([
            'last_name'       => $request->last_name,
            'first_name'      => $request->first_name,
            'middle_name'  => $request->middle_name,
            'suffix'          => $request->suffix,
            'username'        => $request->username,
            'email'           => $request->email,
            'position_id'     => $request->position_id,
            'office_id'       => $request->office_id,
            'contact_number'  => $request->contact_number,
            'password'        => Hash::make($request->password),
            'role_id'         => $request->role_id,
            'status_id'       => 1, // Assuming 1 = Pending in status table
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
                'message' =>  $user->first_name . ' ' . $user->last_name  . ' registered an account and is waiting for approval.',//notify the admin
                'is_read' => false,
            ]);
        }

        return response()->json(['message' => 'User registered successfully'], 201);
    }



    // Login using username
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Check account status via status_id
        if ($user->status_id == 1) { // 1 = Pending
            return response()->json(['message' => 'Your account is still pending approval.'], 403);
        }

        if ($user->status_id == 3) { // 3 = Disapproved
            $message = 'Your account was disapproved.';
            if ($user->rejection_reason) {
                $message .= ' Reason: ' . $user->rejection_reason;
            } else {
                $message .= ' Contact admin.';
            }
            return response()->json(['message' => $message], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        // --- Log in Location Tracking Logic ---
        // Roles: 2=Head, 3=Staff, 4=Requester, 5=Campus_Director
        if (in_array($user->role_id, [2, 3, 4, 5])) {
            $setting = SystemSetting::firstOrCreate(
                ['setting_key' => 'track_login_locations'],
                ['setting_value' => 'false']
            );

            if ($setting->setting_value === 'true') {
                LoginLocation::create([
                    'user_id'   => $user->id,
                    'latitude'  => $request->latitude,
                    'longitude' => $request->longitude,
                    'address'   => $request->address,
                ]);
            }
        }

        return response()->json(['token' => $token, 'user' => $user], 200);

    }






    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out'], 200);
    }



    public function updateAccountStatus(Request $request, $id)
    {
        $request->validate([
            'status_id' => 'required|exists:statuses,id',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Only allow admin to approve (role_id = 1)
        $authUser = Auth::user();
        if ($request->status_id == 2 && $authUser->role_id !== 1) {
            return response()->json(['message' => 'Only admins can approve accounts.'], 403);
        }

        $user->status_id = $request->status_id;
        if ($request->status_id == 2) {
            $user->rejection_reason = null;
            $user->rejected_at = null;
        }
        $user->save();

        // Send email notification only if approved
        if ($user->status_id == 2 && $user->email) {
            $user->notify(new AccountApproved());
        }

        return response()->json(['message' => 'User status approved successfully.']);
    }

    public function rejectAccountStatus(Request $request, $id)
    {
        $request->validate([
            'status_id' => 'required|exists:statuses,id',
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Only allow admin to approve (role_id = 1)
        $authUser = Auth::user();
        if ($request->status_id == 2 && $authUser->role_id !== 1) {
            return response()->json(['message' => 'Only admins can approve accounts.'], 403);
        }

        $user->status_id = $request->status_id;
        $user->rejection_reason = $request->rejection_reason;
        $user->rejected_at = now();
        $user->save();

        // Send email notification only if approved
        // if ($user->status_id == 2 && $user->email) {
        //     $user->notify(new AccountApproved());
        // }

        SystemNotification::create([
            'user_id' => $user->id,
            'reference_id' => $user->id,
            'type' => 'account_request_rejected',
            'message' => 'Your account request was rejected. Reason: ' . $request->rejection_reason,
            'is_read' => false,
        ]);

        return response()->json(['message' => 'User register disapproved successfully.']);
    }



    public function destroy($id)
    {
        $authUser = Auth::user();

        // Only Admins (role_id = 1) can delete accounts
        if (!$authUser || $authUser->role_id !== 1) {
            return response()->json(['message' => 'Unauthorized. Only Admins can delete accounts.'], 403);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Prevent admin from deleting their own account
        if ($authUser->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        // Soft delete — sets deleted_at timestamp, preserves all historical records
        $user->delete();

        return response()->json(['message' => 'User account deleted successfully.'], 200);
    }



    public function getPendingApprovals()
    {
        // Ensure only admins can access this
        $admin = Auth::user();

        if (!$admin || $admin->role_id !== 1) {
            return response()->json(['message' => 'Only admins can view pending approvals.'], 403);
        }

        // Retrieve users who are pending approval (status_id = 1 assumed for 'Pending')
        $pendingUsers = User::with([
            'position',
            'office',
            'status',
            'role'
        ])
        ->where('status_id', 1)
        ->orderBy('created_at', 'desc')
        ->get();

        if ($pendingUsers->isEmpty()) {
            return response()->json(['message' => 'No pending approvals found.'], 200);
        }

        $data = $pendingUsers->map(function ($request) {
            return [
                'user_id' => $request->id,
                'last_name'=> $request->last_name,
                'first_name'=> $request->first_name,
                'middle_name'=> $request->middle_name,
                'suffix'=> $request->suffix,
                'position_id'=>$request->position_id,
                'position' => optional($request->position)->name,
                'role_id'=>$request->role_id,
                'role'=>optional($request->role)->role_name,
                'office_id'=>$request->office_id,
                'office' => optional($request->office)->name,
                'status_id'=>$request->status_id,
                'status' => optional($request->status)->name,
                'contact_number' => $request->contact_number,
                'email' => $request->email,
                'username' => $request->username,
                'created_at' => $request->created_at,
                'updated_at'=> $request->updated_at,
            ];
        });

        return response()->json($data, 200);
    }

    //for display of data only
    public function getUsPass(){
        $Users = Auth::user()
                            ->select('id', 'last_name','first_name', 'middle_name', 'suffix', 'username', 'password')
                            ->orderBy('created_at', 'desc')
                            ->get();

        if ($Users->isEmpty()) {
            return response()->json(['message' => 'Empty.'], 200);
        }

        return response()->json($Users, 200);

    }


    //for getting the fullname
    public function getFullName($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'message' => 'User retrieved successfully.',
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix
        ], 200);
    }


    //for display of data only
    public function getAuthenticatedUserInfo()
    {
        $user = Auth::user(); // Get user from token

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'message' => 'User retrieved successfully.',
            'user_id' => $user->id,   // Return user ID
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix
        ], 200);
    }


    //for display and retrieving of user details only
    public function getUserDetails()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user->load(['position', 'office']);

        return response()->json([
            'user_id' => $user->id,
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix,
            'position_id' => $user->position_id,
            'position' => optional($user->position)->name,
            'office_id' => $user->office_id, // Adjust based on your DB column name
            'office' => optional($user->office)->name,
            'contact_number' => $user->contact_number
        ], 200);
    }

    //get the user's role
    public function getUserDetailRole()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'user_id' => $user->id,
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix,
            'position_id' => $user->position_id,
            'office_id' => $user->office_id, // Adjust based on your DB column name
            'contact_number' => $user->contact_number,
            'role_id' => $user->role_id
        ], 200);
    }


    //another for display purpose
    public function getUserInfo()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix,
            'position_id' => $user->position_id,
            'office_id' => $user->office_id, // Adjust based on your DB column name
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'username' => $user->username
        ], 200);
    }

    //allows editing of account
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'last_name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'middle_name' => 'sometimes|string|max:255',
            'suffix' => 'sometimes|string|max:50|nullable',
            'contact_number' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'password' => 'sometimes|string|min:6|confirmed',
        ]);

        $user->update($request->only([
            'last_name',
            'first_name',
            'middle_name',
            'suffix',
            'contact_number',
            'email',
            'username',
        ]));

        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ], 200);
    }


    public function commonDatas(): JsonResponse
    {
        return response()->json([
            'roles' => Role::all(),
            'offices' => Office::all(),
            'statuses' => Status::all(),
            'positions' => Position::all(),
            'maintenance_types'=>MaintenanceType::all(),
        ]);
    }


     public function usersList()
    {
        $requests = User::with([
            'position',
            'office',
            'status',
            'role'

        ])->get();

        $data = $requests->map(function ($request) {
            return [
                'user_id' => $request->id,
                'last_name'=> $request->last_name,
                'first_name'=> $request->first_name,
                'middle_name'=> $request->middle_name,
                'suffix'=> $request->suffix,
                'position_id'=>$request->position_id,
                'position' => optional($request->position)->name,
                'role_id'=>$request->role_id,
                'role'=>optional($request->role)->role_name,
                'office_id'=>$request->office_id,
                'office' => optional($request->office)->name,
                'status_id'=>$request->status_id,
                'status' => optional($request->status)->name,
                'contact_number' => $request->contact_number,
                'email' => $request->email,
                'username' => $request->username,
                'created_at' => $request->created_at,
                'updated_at'=> $request->updated_at,
            ];
        });

        return response()->json($data);
    }

    public function userDetails(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Eager load relationships if needed
        $user->load([
            'position',
            'office',
            'status',
            'role'
        ]);

        // Map user details
        $data = [
            'user_id' => $user->id,
            'full_name' => trim($user->first_name . ' ' . $user->middle_name . ' ' . $user->last_name . ' ' . $user->suffix),
            'last_name' => $user->last_name,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'suffix' => $user->suffix,
            'position_id' => $user->position_id,
            'position' => optional($user->position)->name,
            'role_id' => $user->role_id,
            'role' => optional($user->role)->role_name,
            'office_id' => $user->office_id,
            'office' => optional($user->office)->name,
            'status_id' => $user->status_id,
            'status' => optional($user->status)->name,
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'username' => $user->username,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        return response()->json($data, 200);
    }

}
