<?php

namespace App\Http\Controllers;
use App\Models\MaintenanceRequest;
use App\Models\Notification as SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\MaintenanceType;
use App\Notifications\MaintenanceRequestCreated;
use Illuminate\Support\Facades\Mail;
use App\Notifications\MaintenanceVerifiedNotification;
use App\Notifications\MaintenanceRequestApproved;
use Illuminate\Support\Facades\Notification;
use App\Notifications\RequestVerifiedByStaff;
use App\Notifications\RequestApprovedByHead;
use App\Notifications\RequestApprovedByCampusDirector;
use App\Notifications\AssignPriorityToRequest;
use App\Notifications\RequestAssignedPriority;
use Carbon\Carbon;
use App\Models\Comment;
class MaintenanceRequestController extends Controller
{
    public function index()
    {
        return response()->json(MaintenanceRequest::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_requested' => 'required|date',
            'details' => 'required|string',
            'requesting_personnel' => 'required|exists:users,id',
            'position_id' => 'required|exists:positions,id',
            'requesting_office' => 'required|exists:offices,id',
            'contact_number' => 'required|string',
            'maintenance_type_id' => 'required|exists:maintenance_types,id',
            'images' => 'nullable|array|max:12',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);


        //image attachment
        $imagePaths = array_fill(0, 12, null);
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $file) {
                if ($index >= 12)
                    break;
                $imagePaths[$index] = $file->store('maintenance_requests', 'public');
            }
        }

        $maintenanceRequest = MaintenanceRequest::create([
            'date_requested' => $request->date_requested,
            'details' => $request->details,
            'requesting_personnel' => $request->requesting_personnel,
            'position_id' => $request->position_id,
            'requesting_office' => $request->requesting_office,
            'contact_number' => $request->contact_number,
            'maintenance_type_id' => $request->maintenance_type_id,
            'status_id' => 1,
            'image_path' => $imagePaths[0],
            'image_path_2' => $imagePaths[1],
            'image_path_3' => $imagePaths[2],
            'image_path_4' => $imagePaths[3],
            'image_path_5' => $imagePaths[4],
            'image_path_6' => $imagePaths[5],
            'image_path_7' => $imagePaths[6],
            'image_path_8' => $imagePaths[7],
            'image_path_9' => $imagePaths[8],
            'image_path_10' => $imagePaths[9],
            'image_path_11' => $imagePaths[10],
            'image_path_12' => $imagePaths[11],
        ]);

        // Create a new maintenance request
        //$maintenanceRequest = MaintenanceRequest::create($request->all());

        // Notify all heads and staff (role_id 2 = head, role_id 3 = staff)
        $submitter = Auth::user();
        if ($submitter && $submitter->role_id !== 2) {
            $usersToNotify = User::whereIn('role_id', [2])->get();

            // Use Notification facade to send notifications in bulk
            Notification::send($usersToNotify, new MaintenanceRequestCreated($submitter->last_name));
        }

        $maintenanceRequest->load(['maintenanceType', 'office']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        $staffUsers = User::where('role_id', 3)->get();

        foreach ($staffUsers as $staff) {
            SystemNotification::create([
                'user_id' => $staff->id,
                'type' => 'maintenance_request_created',
                'message' => '[GS-JS] New ' . $typeName . ' request (Ref: #' . $maintenanceRequest->id . ') submitted by ' . $actorName . '. Please review and verify.',
                'reference_id' => $maintenanceRequest->id,
                'is_read' => false,
            ]);
        }

        // Return a response with the created maintenance request and a message
        return response()->json([
            'message' => 'Maintenance request created and notifications sent.',
            'data' => $maintenanceRequest
        ], 201);
    }

    public function show($id)
    {
        return response()->json(MaintenanceRequest::findOrFail($id));
    }

    // this function is for the staff's verification
    public function verify(Request $request, $id)
    {
        $request->validate([
            'date_received' => 'required|date',
            'time_received' => 'required|date_format:H:i:s',
            'priority_number' => 'nullable|string',
            'remarks' => 'nullable|string',
            'verified_by' => 'required|exists:users,id', // Staff ID must exist in users table
            'comment' => 'nullable|string|max:500'  // ✅ Optional comment field
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Update only the staff's fields
        $maintenanceRequest->update([
            'date_received' => $request->date_received,
            'time_received' => $request->time_received,
            'priority_number' => $request->priority_number,
            'remarks' => $request->remarks,
            'verified_by' => $request->verified_by,
            // 'status_id' => 8,

        ]);

        // ✅ Optional: Create comment if provided
        if ($request->filled('comment')) {
            Comment::create([
                'comment' => $request->comment,
                'request_id' => $maintenanceRequest->id,
                'user_id' => $request->verified_by,
                'role_id' => Auth::user()->role_id,
                'date' => Carbon::now()->toDateString(),
                'time' => Carbon::now()->toTimeString(),
            ]);
        }

        // $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();
        // if ($requester && $requester->email) {
        //     $requester->notify(new MaintenanceVerifiedNotification($maintenanceRequest));
        // }

        // $heads = User::where('role_id', 2)->where('status_id', 2)->get(); // assuming role_id = 2 is Head

        // foreach ($heads as $head) {
        //     $head->notify(new RequestVerifiedByStaff($maintenanceRequest));
        // }

        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel, // requester
            'type' => 'maintenance_verified',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request has been verified by Staff ' . $actorName . '. It is now forwarded to the GSO Head for approval.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);


        $requesterRoleId = optional($maintenanceRequest->requester)->role_id;
        if ($requesterRoleId === 2) {
            $users = User::where('role_id', 5)->get();
            foreach ($users as $user) {
                SystemNotification::create([
                    'user_id' => $user->id,
                    'type' => 'maintenance_request_verified',
                    'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): A request submitted by a Head has been verified by Staff ' . $actorName . ' and is awaiting your approval.',
                    'reference_id' => $maintenanceRequest->id,
                    'is_read' => false,
                ]);
            }
        } else {
            $users = User::where('role_id', 2)->get();
            foreach ($users as $user) {
                SystemNotification::create([
                    'user_id' => $user->id,
                    'type' => 'maintenance_request_verified',
                    'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): A maintenance request has been verified by Staff ' . $actorName . ' and is awaiting your approval.',
                    'reference_id' => $maintenanceRequest->id,
                    'is_read' => false,
                ]);
            }
        }

        return response()->json([
            'message' => 'Maintenance request reviewed successfully',
            'data' => $maintenanceRequest,
        ], 200);
    }

    // this function is for the approval of heads
    public function approve(Request $request, $id)
    {
        $user = Auth::user(); // Get the currently logged-in user
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        //  Ensure only Heads (role_id = 2) can approve
        if ($user->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        //  Step 1: Assign first approver
        if (is_null($maintenanceRequest->approved_by_1)) {
            $maintenanceRequest->approved_by_1 = $user->id;
        }
        // Step 2: Assign second approver and auto-approve
        elseif (is_null($maintenanceRequest->approved_by_2)) {
            // Prevent same user from approving twice
            if ($maintenanceRequest->approved_by_1 == $user->id) {
                return response()->json(['message' => 'You have already approved this request.'], 400);
            }

            $maintenanceRequest->approved_by_2 = $user->id;
            $maintenanceRequest->status = 2; // Auto-update status

            // Notify the requester by email after final approval
            $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();

            if ($requester && $requester->email) {
                $requester->notify(new MaintenanceRequestApproved($maintenanceRequest));
            }
        } else {
            return response()->json(['message' => 'Request is already fully approved'], 400);
        }

        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Request approved successfully',
            'maintenance_request' => $maintenanceRequest
        ]);
    }

    public function approveByHead(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role_id !== 2) {
            return response()->json(['message' => 'Only Heads can perform this approval.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        $requesterRoleId = optional($maintenanceRequest->requester)->role_id;
        if ($requesterRoleId === 2) {
            return response()->json([
                'message' => 'This request was submitted by a Head, so Head approval is skipped. It goes directly to the Campus Director after staff verification.'
            ], 400);
        }

        if (!is_null($maintenanceRequest->approved_by_1)) {
            return response()->json(['message' => 'Already approved by a Head.'], 400);
        }

        $request->validate([
            'comment' => 'nullable|string|max:500'  // ✅ Optional comment field
        ]);

        // ✅ Optional: Create comment if provided
        if ($request->filled('comment')) {
            Comment::create([
                'comment' => $request->comment,
                'request_id' => $maintenanceRequest->id,
                'user_id' => Auth::user()->id,
                'role_id' => Auth::user()->role_id,
                'date' => Carbon::now()->toDateString(),
                'time' => Carbon::now()->toTimeString(),
            ]);
        }
        $maintenanceRequest->approved_by_1 = $user->id;
        // $maintenanceRequest->status_id = 9;
        $maintenanceRequest->save();

        // Notify the requester by email after final approval
        // $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();

        // if ($requester && $requester->email) {
        //     $requester->notify(new MaintenanceRequestApproved($maintenanceRequest));
        // }

        // Notify the campus director
        $campusDirectors = User::where('role_id', 5)->where('status_id', 2)->get(); // assuming role_id 5 = Campus Director
        foreach ($campusDirectors as $director) {
            $director->notify(new RequestApprovedByHead($maintenanceRequest));
        }

        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel, // requester
            'type' => 'maintenance_request_approved_by_head',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request has been approved by GSO Head ' . $actorName . '. It is now forwarded to the Campus Director for final approval.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);


        $users = User::where('role_id', 5)->get();

        foreach ($users as $user) {
            SystemNotification::create([
                'user_id' => $user->id,
                'type' => 'maintenance_request_approved_by_head',
                'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Approved by GSO Head ' . $actorName . '. This request is now awaiting your final approval.',
                'reference_id' => $maintenanceRequest->id,
                'is_read' => false,
            ]);
        }


        return response()->json([
            'message' => 'Approved by Head successfully.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }



    public function approveByDirector(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role_id !== 5) {////////means it is a campus director
            return response()->json(['message' => 'Only the Campus Director can perform this approval.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        $requesterRoleId = optional($maintenanceRequest->requester)->role_id;
        if (is_null($maintenanceRequest->approved_by_1) && $requesterRoleId !== 2) {
            return response()->json(['message' => 'This request must first be approved by a Head.'], 400);
        }

        if (!is_null($maintenanceRequest->approved_by_2)) {
            return response()->json(['message' => 'Already approved by the Campus Director.'], 400);
        }


        $request->validate([
            'comment' => 'nullable|string|max:500'  // ✅ Optional comment field
        ]);

        // ✅ Optional: Create comment if provided
        if ($request->filled('comment')) {
            Comment::create([
                'comment' => $request->comment,
                'request_id' => $maintenanceRequest->id,
                'user_id' => Auth::user()->id,
                'role_id' => Auth::user()->role_id,
                'date' => Carbon::now()->toDateString(),
                'time' => Carbon::now()->toTimeString(),
            ]);
        }

        $maintenanceRequest->approved_by_2 = $user->id;
        // $maintenanceRequest->status_id = 10;
        $maintenanceRequest->save();

        // Notify Requester
        // $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();
        // if ($requester && $requester->email) {
        //     $requester->notify(new RequestApprovedByCampusDirector($maintenanceRequest));
        // }

        // Notify Staff
        $staffMembers = User::where('role_id', 3)->where('status_id', 2)->get(); // Assuming role_id = 3 is staff
        foreach ($staffMembers as $staff) {
            $staff->notify(new AssignPriorityToRequest($maintenanceRequest));
        }

        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel, // requester
            'type' => 'maintenance_request_approved_by_campus_director',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request has been fully approved by Campus Director ' . $actorName . '. Staff will assign a priority number shortly.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        $staffUsers = User::where('role_id', 3)->get();

        foreach ($staffUsers as $staff) {
            SystemNotification::create([
                'user_id' => $staff->id,
                'type' => 'maintenance_request_approved_by_campus_director',
                'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Fully approved by Campus Director ' . $actorName . '. Please assign a priority number.',
                'reference_id' => $maintenanceRequest->id,
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Approved by Campus Director successfully. Request is now fully approved.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }








    //this function gets the data of an specific maintenance request filled up by the requester
    public function staffpov($id)
    {
        $request = MaintenanceRequest::with([
            'requester',
            'position',
            'office',
            'status',
            'verifier',
            'approver1',
            'approver2',
            'maintenanceType',
            'comments.user',     // include comment user
            'comments.role',      // if you want to show role name too
            'feedback'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        $requester = optional($request->requester);
        $fullName = trim(
            ($requester->last_name ? $requester->last_name . ', ' : '') .
            ($requester->first_name ?? '') . ' ' .
            ($requester->middle_name ?? '') . ' ' .
            ($requester->suffix ?? '')
        );

        $data = [
            'request_id' => $request->id,
            'date_requested' => $request->date_requested,
            'details' => $request->details,
            'requester_id' => $request->requesting_personnel,
            'requester_role_id' => optional($requester)->role_id,
            'requesting_personnel' => $fullName,
            'position' => optional($request->position)->name,
            'requesting_office' => optional($request->office)->name,
            'requesting_office_id' => $request->requesting_office,
            'contact_number' => $request->contact_number,
            'status' => optional($request->status)->name,
            'maintenance_type' => optional($request->maintenanceType)->type_name,
            'maintenance_type_id' => $request->maintenance_type_id,
            'verified_by' => optional($request->verifier)->last_name,
            'approved_by_1' => optional($request->approver1)->last_name,
            'approved_by_2' => optional($request->approver2)->last_name,
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'assigned_staff_id' => $request->assigned_staff,
            'has_feedback' => !is_null($request->feedback),
            'image_urls' => array_values(array_filter([
                $request->image_path ? asset('storage/' . $request->image_path) : null,
                $request->image_path_2 ? asset('storage/' . $request->image_path_2) : null,
                $request->image_path_3 ? asset('storage/' . $request->image_path_3) : null,
                $request->image_path_4 ? asset('storage/' . $request->image_path_4) : null,
                $request->image_path_5 ? asset('storage/' . $request->image_path_5) : null,
                $request->image_path_6 ? asset('storage/' . $request->image_path_6) : null,
                $request->image_path_7 ? asset('storage/' . $request->image_path_7) : null,
                $request->image_path_8 ? asset('storage/' . $request->image_path_8) : null,
                $request->image_path_9 ? asset('storage/' . $request->image_path_9) : null,
                $request->image_path_10 ? asset('storage/' . $request->image_path_10) : null,
                $request->image_path_11 ? asset('storage/' . $request->image_path_11) : null,
                $request->image_path_12 ? asset('storage/' . $request->image_path_12) : null,
            ])),
            'created_at' => $request->created_at,
            'updated_at' => $request->updated_at,

            // Include comments
            'comments' => $request->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'user' => optional($comment->user)->first_name . ' ' . optional($comment->user)->last_name,
                    'role' => optional($comment->role)->role_name,
                    'date' => $comment->date,
                    'time' => $comment->time,
                ];
            }),
        ];

        return response()->json($data);
    }


    //this function shows the used priority numbers
    public function getUsedPriorityNumbers()
    {
        $usedPriorityNumbers = MaintenanceRequest::whereNotNull('priority_number')
            ->pluck('priority_number')
            ->unique()
            ->values();

        return response()->json($usedPriorityNumbers);
    }





    //staff denies the maintenance request
    public function denyRequest(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404); // Alternative to Response::HTTP_NOT_FOUND
        }

        // Check if the authenticated user is a staff member (role_id = 3)
        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403); // Alternative to Response::HTTP_FORBIDDEN
        }

        // Validate request input
        $request->validate([
            'date_received' => 'required|date',
            'time_received' => 'required|date_format:H:i:s',
            'comment' => 'required|string|max:1000',
            // 'remarks' => 'required|string|max:255',

        ]);

        // Update the request status and remarks
        $maintenanceRequest->update([
            'date_received' => $request->date_received,
            'time_received' => $request->time_received,
            // 'remarks' => $request->remarks,
            'status_id' => 3, //3 means dissaproved
            'priority_number' => null,
        ]);

        // Create comment (reason for disapproval)
        Comment::create([
            'comment' => $request->comment,
            'request_id' => $maintenanceRequest->id,
            'user_id' => Auth::user()->id,
            'role_id' => Auth::user()->role_id,
            'date' => \Carbon\Carbon::now()->toDateString(),
            'time' => \Carbon\Carbon::now()->toTimeString(),
        ]);

        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel, // requester
            'type' => 'maintenance_request_denied',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request was denied by Staff ' . $actorName . '. Please check the app for the reason and contact the GSO office if needed.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Maintenance request has been denied.',
            'data' => $maintenanceRequest
        ], 200); // Alternative to Response::HTTP_OK
    }

    //autosaves the date and time in the request
    public function autosaveDateTime($id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Check if the authenticated user is a staff member (role_id = 3)
        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only set the timestamp if it's null (first time viewing)
        if (!$maintenanceRequest->date_received && !$maintenanceRequest->time_received) {
            $maintenanceRequest->date_received = now()->toDateString();  // e.g., "2025-04-02"
            $maintenanceRequest->time_received = now()->toTimeString();  // e.g., "15:20:00" (3:20 PM)
            $maintenanceRequest->save();
        }

        return response()->json([
            'message' => 'View timestamp saved successfully (only once).',
            'data' => $maintenanceRequest
        ], 200);
    }


    //function for schedules
    public function getSchedules()
    {
        // Get the authenticated user's role
        $user = Auth::user();

        // Allow only Admin (1), Head (2), and Staff (3)
        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Retrieve schedules with only selected fields
        $schedules = MaintenanceRequest::select('date_requested', 'details', 'requesting_office')->get();

        return response()->json([
            'message' => 'Schedules retrieved successfully.',
            'data' => $schedules
        ], 200);
    }


    //head dissapproves the request
    public function disapprove(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Only heads (role_id = 2) can disapprove — uncomment if needed
        // if (Auth::user()->role_id !== 2) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        // Require omment
        $request->validate([
            // 'remarks' => 'required|string|max:255',
            'comment' => 'required|string|max:1000',
        ]);

        // Update request status to "Disapproved"
        $maintenanceRequest->update([
            'status_id' => 3,
            //'remarks' => $request->remarks,
            'priority_number' => null,
        ]);

        // Create comment (reason for disapproval)
        Comment::create([
            'comment' => $request->comment,
            'request_id' => $maintenanceRequest->id,
            'user_id' => Auth::user()->id,
            'role_id' => Auth::user()->role_id,
            'date' => \Carbon\Carbon::now()->toDateString(),
            'time' => \Carbon\Carbon::now()->toTimeString(),
        ]);

        // Notify the requester
        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel,
            'type' => 'maintenance_request_disapproved',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request was disapproved by GSO Head ' . $actorName . '. Please check the app for the reason.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Maintenance request has been disapproved.',
        ], 200);
    }



    //for display of data purposes only
    public function headpov($id)
    {
        $request = MaintenanceRequest::with([
            'requester',
            'position',
            'office',
            'status',
            'verifier',
            'approver1',
            'maintenanceType',
            'comments.user',
            'comments.role',
            'feedback'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        $requester = optional($request->requester);
        $fullName = trim(
            ($requester->last_name ? $requester->last_name . ', ' : '') .
            ($requester->first_name ?? '') . ' ' .
            ($requester->middle_name ?? '') . ' ' .
            ($requester->suffix ?? '')
        );

        $data = [
            'request_id' => $request->id,
            'date_requested' => $request->date_requested,
            'details' => $request->details,
            'requester_id' => $request->requesting_personnel,
            'requester_role_id' => optional($requester)->role_id,
            'requesting_personnel' => $fullName,
            'position' => optional($request->position)->name,
            'requesting_office' => optional($request->office)->name,
            'contact_number' => $request->contact_number,
            'status' => optional($request->status)->name,
            'date_received' => $request->date_received,
            'time_received' => $request->time_received,
            'priority_number' => $request->priority_number,
            'remarks' => $request->remarks,
            'verified_by' => optional($request->verifier)->last_name,
            'approved_by_1' => optional($request->approver1)->last_name,
            'maintenance_type' => optional($request->maintenanceType)->type_name,
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'assigned_staff_id' => $request->assigned_staff,
            'has_feedback' => !is_null($request->feedback),
            'image_urls' => array_values(array_filter([
                $request->image_path ? asset('storage/' . $request->image_path) : null,
                $request->image_path_2 ? asset('storage/' . $request->image_path_2) : null,
                $request->image_path_3 ? asset('storage/' . $request->image_path_3) : null,
                $request->image_path_4 ? asset('storage/' . $request->image_path_4) : null,
                $request->image_path_5 ? asset('storage/' . $request->image_path_5) : null,
                $request->image_path_6 ? asset('storage/' . $request->image_path_6) : null,
                $request->image_path_7 ? asset('storage/' . $request->image_path_7) : null,
                $request->image_path_8 ? asset('storage/' . $request->image_path_8) : null,
                $request->image_path_9 ? asset('storage/' . $request->image_path_9) : null,
                $request->image_path_10 ? asset('storage/' . $request->image_path_10) : null,
                $request->image_path_11 ? asset('storage/' . $request->image_path_11) : null,
                $request->image_path_12 ? asset('storage/' . $request->image_path_12) : null,
            ])),
            'created_at' => $request->created_at,
            'updated_at' => $request->updated_at,

            // Include comments
            'comments' => $request->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'user' => optional($comment->user)->first_name . ' ' . optional($comment->user)->last_name,
                    'role' => optional($comment->role)->role_name,
                    'date' => $comment->date,
                    'time' => $comment->time,
                ];
            }),
        ];

        return response()->json($data);
    }



    public function directorpov($id)
    {
        $request = MaintenanceRequest::with([
            'requester',
            'position',
            'office',
            'status',
            'verifier',
            'approver1',
            'approver2',
            'maintenanceType',
            'comments.user',
            'comments.role',
            'feedback'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        $requester = optional($request->requester);
        $fullName = trim(
            ($requester->last_name ? $requester->last_name . ', ' : '') .
            ($requester->first_name ?? '') . ' ' .
            ($requester->middle_name ?? '') . ' ' .
            ($requester->suffix ?? '')
        );

        $data = [
            'request_id' => $request->id,
            'date_requested' => $request->date_requested,
            'details' => $request->details,
            'requester_id' => $request->requesting_personnel,
            'requester_role_id' => optional($requester)->role_id,
            'requesting_personnel' => $fullName,
            'position' => optional($request->position)->name,
            'requesting_office' => optional($request->office)->name,
            'contact_number' => $request->contact_number,
            'status' => optional($request->status)->name,
            'date_received' => $request->date_received,
            'time_received' => $request->time_received,
            'priority_number' => $request->priority_number,
            'remarks' => $request->remarks,
            'verified_by' => optional($request->verifier)->last_name,
            'approved_by_1' => optional($request->approver1)->last_name,
            'approved_by_2' => optional($request->approver2)->last_name,
            'maintenance_type' => optional($request->maintenanceType)->type_name,
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'assigned_staff_id' => $request->assigned_staff,
            'has_feedback' => !is_null($request->feedback),
            'image_urls' => array_values(array_filter([
                $request->image_path ? asset('storage/' . $request->image_path) : null,
                $request->image_path_2 ? asset('storage/' . $request->image_path_2) : null,
                $request->image_path_3 ? asset('storage/' . $request->image_path_3) : null,
                $request->image_path_4 ? asset('storage/' . $request->image_path_4) : null,
                $request->image_path_5 ? asset('storage/' . $request->image_path_5) : null,
                $request->image_path_6 ? asset('storage/' . $request->image_path_6) : null,
                $request->image_path_7 ? asset('storage/' . $request->image_path_7) : null,
                $request->image_path_8 ? asset('storage/' . $request->image_path_8) : null,
                $request->image_path_9 ? asset('storage/' . $request->image_path_9) : null,
                $request->image_path_10 ? asset('storage/' . $request->image_path_10) : null,
                $request->image_path_11 ? asset('storage/' . $request->image_path_11) : null,
                $request->image_path_12 ? asset('storage/' . $request->image_path_12) : null,
            ])),
            'created_at' => $request->created_at,
            'updated_at' => $request->updated_at,

            // Include comments
            'comments' => $request->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'user' => optional($comment->user)->first_name . ' ' . optional($comment->user)->last_name,
                    'role' => optional($comment->role)->role_name,
                    'date' => $comment->date,
                    'time' => $comment->time,
                ];
            }),
        ];

        return response()->json($data);
    }





    //allows editing of the maintenance request
    public function updateDetails(Request $request, $id)
    {
        // Find the maintenance request
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Optional: Only allow update if status is still Pending
        if ($maintenanceRequest->status_id !== 1) {
            return response()->json(['message' => 'Cannot edit a request that is already processed.'], 403);
        }

        // Validate that only 'details' is being updated
        $request->validate([
            'details' => 'required|string|max:255',
        ]);

        // Update the 'details' field
        $maintenanceRequest->details = $request->details;
        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Maintenance request details updated successfully.',
            'data' => $maintenanceRequest,
        ], 200);
    }


    public function markAsUrgent(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // ✅ Validate the request input
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        // ✅ Store the comment
        Comment::create([
            'comment' => $request->comment,
            'request_id' => $maintenanceRequest->id,
            'user_id' => Auth::user()->id,
            'role_id' => Auth::user()->role_id,
            'date' => \Carbon\Carbon::now()->toDateString(),
            'time' => \Carbon\Carbon::now()->toTimeString(),
        ]);

        // ✅ Update the request to "Urgent"
        $maintenanceRequest->status_id = 6;
        $maintenanceRequest->save();

        // ✅ Notify the requester
        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel,
            'type' => 'maintenance_request_urgent',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request has been flagged as URGENT by ' . $actorName . '. It will be prioritized immediately.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Maintenance request marked as urgent.',
            'data' => $maintenanceRequest
        ]);
    }



    public function markAsOnHold(Request $request, $id)
    {

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // ✅ Validate optional comment
        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        // ✅ Save comment
        Comment::create([
            'comment' => $request->comment,
            'request_id' => $maintenanceRequest->id,
            'user_id' => Auth::user()->id,
            'role_id' => Auth::user()->role_id,
            'date' => Carbon::now()->toDateString(),
            'time' => Carbon::now()->toTimeString(),
        ]);

        // ✅ Update status to On Hold
        $maintenanceRequest->status_id = 7;
        $maintenanceRequest->save();

        // ✅ Create system notification for requester
        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel,
            'type' => 'maintenance_request_onhold',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request has been placed ON HOLD by ' . $actorName . '. Please check the app for the reason.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Maintenance request marked as on hold.',
            'data' => $maintenanceRequest
        ]);
    }



    //this cancels the request of the user
    public function cancelRequest($id)
    {
        $request = MaintenanceRequest::find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if ($request->status_id != 1) {
            return response()->json(['message' => 'Only pending requests can be canceled.'], 400);
        }

        $request->status_id = 5; // 5 = canceled
        $request->save();

        return response()->json(['message' => 'Maintenance request canceled successfully.']);
    }


    public function indexWithDetails()
    {
        $requests = MaintenanceRequest::with([
            'requester',
            'position',
            'office',
            'status',
            'verifier',
            'approver1',
            'approver2',
            'maintenanceType',
            'comments.user',     // include comment user
            'comments.role',     // if you want to show role name too
            'feedback'
        ])->get();

        $data = $requests->map(function ($request) {

            $requester = optional($request->requester);
            $fullName = trim(
                ($requester->last_name ? $requester->last_name . ', ' : '') .
                ($requester->first_name ?? '') . ' ' .
                ($requester->middle_name ?? '') . ' ' .
                ($requester->suffix ?? '')
            );

            return [
                'request_id' => $request->id,
                'date_requested' => $request->date_requested,
                'details' => $request->details,
                'requester_id' => $request->requesting_personnel,
                'requester_role_id' => optional($requester)->role_id,
                'requesting_personnel' => $fullName,
                'position' => optional($request->position)->name,
                'requesting_office' => optional($request->office)->name,
                'contact_number' => $request->contact_number,
                'status' => optional($request->status)->name,
                'date_received' => $request->date_received,
                'time_received' => $request->time_received,
                'priority_number' => $request->priority_number,
                // 'remarks' => $request->remarks,
                'verified_by' => optional($request->verifier)->last_name,
                'approved_by_1' => optional($request->approver1)->last_name,
                'approved_by_2' => optional($request->approver2)->last_name,
                'maintenance_type' => optional($request->maintenanceType)->type_name,
                'scheduled_date' => $request->scheduled_date,
                'scheduled_time' => $request->scheduled_time,
                'assigned_staff_id' => $request->assigned_staff,
                'has_feedback' => !is_null($request->feedback),
                'created_at' => $request->created_at,
                'updated_at' => $request->updated_at,
                'image_urls' => array_values(array_filter([
                    $request->image_path ? asset('storage/' . $request->image_path) : null,
                    $request->image_path_2 ? asset('storage/' . $request->image_path_2) : null,
                    $request->image_path_3 ? asset('storage/' . $request->image_path_3) : null,
                    $request->image_path_4 ? asset('storage/' . $request->image_path_4) : null,
                ])),

                // Include comments
                'comments' => $request->comments->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'comment' => $comment->comment,
                        'user' => optional($comment->user)->first_name . ' ' . optional($comment->user)->last_name,
                        'role' => optional($comment->role)->role_name,
                        'date' => $comment->date,
                        'time' => $comment->time,
                    ];
                }),
            ];
        });

        return response()->json($data);
    }

    public function forPriorityNumber()
    {
        $requests = MaintenanceRequest::with([

            'maintenanceType'
        ])->get();
        $data = $requests->map(function ($request) {
            return [
                'request_id' => $request->id,
                'maintenance_type' => optional($request->maintenanceType)->type_name,
                'date_received' => $request->date_received,
                'time_received' => $request->time_received,
            ];
        });
        return response()->json($data);
    }



    public function assignPriority(Request $request, $id)
    {
        $request->validate([
            'priority_number' => 'required|string',
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Update the priority number
        $maintenanceRequest->priority_number = $request->priority_number;
        $maintenanceRequest->status_id = 2; // Approved status ID
        $maintenanceRequest->save();

        // Notify the requester
        $requester = User::find($maintenanceRequest->requesting_personnel);

        if ($requester && $requester->email) {
            $requester->notify(new RequestAssignedPriority($maintenanceRequest));
        }


        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel, // requester
            'type' => 'maintenance_request_completely_approved',
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . '): Your request is now fully approved with Priority No. ' . $maintenanceRequest->priority_number . '. Please wait for the maintenance schedule.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Priority number assigned successfully.',
            'data' => $maintenanceRequest,
        ]);
    }

    public function assignSchedule(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Only Staff (role_id = 3) can assign a schedule
        if ($user->role_id !== 3) {
            return response()->json(['message' => 'Only Staff can assign a schedule.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Must be in Approved status (status_id = 2) before scheduling
        if ($maintenanceRequest->status_id !== 2) {
            return response()->json(['message' => 'Request must be fully approved before scheduling.'], 422);
        }

        $request->validate([
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|date_format:H:i',
            'assigned_staff' => 'required|exists:users,id',
            'scheduled_notes' => 'nullable|string|max:1000',
        ]);

        $maintenanceRequest->update([
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'assigned_staff' => $request->assigned_staff,
            'scheduled_notes' => $request->scheduled_notes,
            'status_id' => 4, // 4 = Done (TEMPORARY OVERRIDE for immediate feedback)
        ]);

        // Notify the requester
        $maintenanceRequest->load(['maintenanceType']);
        $typeName = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;
        $priorityInfo = $maintenanceRequest->priority_number ? ' | Priority No. ' . $maintenanceRequest->priority_number : '';

        SystemNotification::create([
            'user_id' => $maintenanceRequest->requesting_personnel,
            'type' => 'maintenance_request_done', // Changed to trigger feedback prompt
            'message' => '[GS-JS] Ref #' . $maintenanceRequest->id . ' (' . $typeName . $priorityInfo . '): Your request has been completed by Staff ' . $actorName . '. We\'d appreciate your feedback in the app.',
            'reference_id' => $maintenanceRequest->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Schedule assigned successfully.',
            'data' => $maintenanceRequest,
        ], 200);
    }


    public function markAsDone($id)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Only Staff (role_id = 3) can mark as done
        if ($user->role_id !== 3) {
            return response()->json(['message' => 'Only Staff can mark a request as done.'], 403);
        }

        $request = MaintenanceRequest::find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Must be in Scheduled status (status_id = 9) with a scheduled_date
        if ($request->status_id !== 9 || is_null($request->scheduled_date)) {
            return response()->json([
                'message' => 'Request must be scheduled (with a scheduled date) before marking as done.'
            ], 422);
        }

        $request->status_id = 4; // 4 = Done
        $request->save();

        $request->load(['maintenanceType']);
        $typeName = optional($request->maintenanceType)->type_name ?? 'Maintenance';
        $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;
        $priorityInfo = $request->priority_number ? ' | Priority No. ' . $request->priority_number : '';

        SystemNotification::create([
            'user_id' => $request->requesting_personnel,
            'type' => 'maintenance_request_done',
            'message' => '[GS-JS] Ref #' . $request->id . ' (' . $typeName . $priorityInfo . '): Your request has been completed by Staff ' . $actorName . '. We\'d appreciate your feedback in the app.',
            'reference_id' => $request->id,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Maintenance request marked as done.',
            'data' => $request
        ]);
    }



    public function generatePriorityNumber($maintenanceTypeId)
    {
        $maintenanceType = MaintenanceType::find($maintenanceTypeId);

        if (!$maintenanceType) {
            return response()->json(['message' => 'Maintenance type not found.'], 404);
        }

        $firstLetter = strtoupper(substr($maintenanceType->type_name, 0, 1));
        $year = now()->format('y');
        $month = now()->format('n');

        $count = MaintenanceRequest::where('maintenance_type_id', $maintenanceType->id)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->whereNotNull('approved_by_2')  // <-- added condition
            ->whereNotNull('priority_number')
            ->count();

        $runningNumber = $count + 1;
        $priorityNumber = "{$firstLetter}-{$year}-{$month}-{$runningNumber}";

        return response()->json([
            'priority_number' => $priorityNumber
        ], 200);
    }

    public function getRequestDate($id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        return response()->json([
            //'request_id' => $maintenanceRequest->id,
            'request_date' => $maintenanceRequest->date_requested
        ], 200);
    }


}






