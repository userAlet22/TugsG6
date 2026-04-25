<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\MaintenanceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\FeedbackSubmitted;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Accept both field names for compatibility
            'maintenance_request_id' => 'sometimes|exists:maintenance_requests,id',
            'request_id'             => 'sometimes|exists:maintenance_requests,id',
            'rating'                 => 'required|integer|min:1|max:5',
            'comment'                => 'nullable|string|max:2000',
        ]);

        // Normalize field name: frontend may send request_id or maintenance_request_id
        $maintenanceRequestId = $validated['maintenance_request_id']
            ?? $validated['request_id']
            ?? null;

        if (!$maintenanceRequestId) {
            return response()->json(['message' => 'A maintenance request ID is required.'], 422);
        }

        $maintenance = MaintenanceRequest::find($maintenanceRequestId);

        if (!$maintenance) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Request must be Done (status_id = 4) before feedback can be submitted
        if ($maintenance->status_id !== 4) {
            return response()->json([
                'message' => 'Feedback can only be submitted for completed (done) requests.'
            ], 422);
        }

        // Prevent duplicate feedback (TC-5-009)
        $existingFeedback = Feedback::where('maintenance_request_id', $maintenanceRequestId)->first();
        if ($existingFeedback) {
            return response()->json([
                'message' => 'Feedback has already been submitted for this request.'
            ], 409);
        }

        $feedback = Feedback::create([
            'user_id'                => Auth::id(),
            'maintenance_request_id' => $maintenanceRequestId,
            'rating'                 => $validated['rating'],
            'feedback_comment'       => $validated['comment'] ?? null,
            // Legacy CSMS columns — filled with neutral defaults to satisfy NOT NULL constraints
            'client_type'    => 'N/A',
            'service_type'   => 'N/A',
            'request_date'   => now()->toDateString(),
            'date'           => now()->toDateString(),
            'sex'            => 'N/A',
            'age'            => 0,
            'office_visited' => 'N/A',
            'service_availed'=> 'N/A',
            'cc1'            => 1,
            'sqd0' => $validated['rating'], 'sqd1' => $validated['rating'],
            'sqd2' => $validated['rating'], 'sqd3' => $validated['rating'],
            'sqd4' => $validated['rating'], 'sqd5' => $validated['rating'],
            'sqd6' => $validated['rating'], 'sqd7' => $validated['rating'],
            'sqd8' => $validated['rating'],
        ]);

        // Notify staff & head
        $staffUsers = User::whereIn('role_id', [2, 3])
            ->whereNotNull('email')
            ->get();

        foreach ($staffUsers as $staff) {
            $staff->notify(new FeedbackSubmitted($feedback));
        }

        return response()->json([
            'message' => 'Feedback submitted successfully.',
            'data'    => [
                'id'                     => $feedback->id,
                'maintenance_request_id' => $feedback->maintenance_request_id,
                'rating'                 => $feedback->rating,
                'comment'                => $feedback->feedback_comment,
                'created_at'             => $feedback->created_at,
            ]
        ], 201);
    }





    // Show a specific feedback
    public function show($id)
    {
        return response()->json(Feedback::findOrFail($id));
    }

    // Update feedback
    public function update(Request $request, $id)
    {
        $feedback = Feedback::findOrFail($id);
        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comments' => 'sometimes|string',
        ]);

        $feedback->update($validated);

        return response()->json($feedback);
    }

    // Delete feedback
    public function destroy($id)
    {
        Feedback::destroy($id);
        return response()->json(['message' => 'Feedback deleted']);
    }



    public function showFeedbackDetails($id)
    {
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json(['message' => 'Feedback not found.'], 404);
        }

        return response()->json([
            'id' => $feedback->id,
            'maintenance_request_id' => $feedback->maintenance_request_id,
            'rating' => $feedback->rating,
            'comment' => $feedback->feedback_comment,
            // Keep legacy fields below just in case older app versions still expect them
            'client_type' => $feedback->client_type,
            'service_type' => $feedback->service_type,
            'date'=> $feedback->date,
            'sex' => $feedback->sex,
            'region' => $feedback->region,
            'age' => $feedback->age,
            'office_visited' => $feedback->office_visited,
            'service_availed' => $feedback->service_availed,
            'cc1' => $feedback->cc1,
            'cc2' => $feedback->cc2,
            'cc3' => $feedback->cc3,
            'sqd0' => $feedback->sqd0,
            'sqd1' => $feedback->sqd1,
            'sqd2' => $feedback->sqd2,
            'sqd3' => $feedback->sqd3,
            'sqd4' => $feedback->sqd4,
            'sqd5' => $feedback->sqd5,
            'sqd6' => $feedback->sqd6,
            'sqd7' => $feedback->sqd7,
            'sqd8' => $feedback->sqd8,
            'suggestions' => $feedback->suggestions,
            'email' => $feedback->email,
        ], 200);
    }

    public function index()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated or invalid token.'], 401);
        }

        // Only Admin (role_id = 1) can access and review feedback data (TC-5-006)
        if ($user->role_id !== 1) {
            return response()->json(['message' => 'Only Admins can view feedback data.'], 403);
        }

        $feedbacks = Feedback::with('user')->get()->map(function ($feedback) {
            return [
                'id' => $feedback->id,
                'maintenance_request_id' => $feedback->maintenance_request_id,
                'request_id' => $feedback->maintenance_request_id, // Alias for frontend convenience
                'rating' => $feedback->rating,
                'comment' => $feedback->feedback_comment, // Resolves the mismatch here
                'created_at' => $feedback->created_at,
                'user' => [
                    'id' => optional($feedback->user)->id,
                    'name' => trim(optional($feedback->user)->first_name . ' ' . optional($feedback->user)->last_name)
                ]
            ];
        });

        return response()->json([
            'message' => 'All feedbacks retrieved successfully.',
            'data'    => $feedbacks
        ]);
    }

      public function getByRequest($maintenance_request_id)
    {
        $feedback = Feedback::where('maintenance_request_id', $maintenance_request_id)->first();

        if (!$feedback) {
            return response()->json(['message' => 'Feedback not found for this request.'], 404);
        }

        return response()->json($feedback);
    }


}
