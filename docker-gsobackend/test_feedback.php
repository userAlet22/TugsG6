<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Feedback;
use App\Models\MaintenanceRequest;
use App\Models\User;

// 1. Pick a request id, or find any request id
$request = MaintenanceRequest::where('status_id', 4)->first();
if (!$request) echo "No Done request found.\n";
$reqId = $request ? $request->id : 47; // Default to 47 if none

echo "\n--- TESTING REQUEST #$reqId ---\n";

// Ensure it doesn't already exist to test full creation, or just see if it exists
$existing = Feedback::where('maintenance_request_id', $reqId)->first();
if ($existing) {
    echo "Row already exists! ID: " . $existing->id . "\n";
} else {
    echo "Creating new feedback row...\n";
    $existing = Feedback::create([
        'user_id' => 2, // arbitrary user
        'maintenance_request_id' => $reqId,
        'rating' => 5,
        'feedback_comment' => "Direct DB Test",
        'client_type' => 'N/A', 'service_type' => 'N/A', 'request_date' => now()->toDateString(),
        'date' => now()->toDateString(), 'sex' => 'N/A', 'age' => 0, 'office_visited' => 'N/A',
        'service_availed' => 'N/A', 'cc1' => 1, 'sqd0' => 5, 'sqd1' => 5, 'sqd2' => 5, 'sqd3' => 5,
        'sqd4' => 5, 'sqd5' => 5, 'sqd6' => 5, 'sqd7' => 5, 'sqd8' => 5,
    ]);
    echo "Created with ID: " . $existing->id . "\n";
}

// Emulate GET /api/feedbacks mapping logic
$feedbacks = Feedback::with('user')->get()->map(function ($feedback) {
    return [
        'id' => $feedback->id,
        'maintenance_request_id' => $feedback->maintenance_request_id,
        'request_id' => $feedback->maintenance_request_id,
        'rating' => $feedback->rating,
        'comment' => $feedback->feedback_comment,
    ];
});

$foundInList = $feedbacks->firstWhere('maintenance_request_id', $reqId);
if ($foundInList) {
    echo "FOUND in /api/feedbacks list! Mapped output:\n";
    echo json_encode($foundInList, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "ERROR: Missing from /api/feedbacks list!\n";
}

// Emulate GET /api/feedbacks/{feedback_id}/details logic
$details = Feedback::find($existing->id);
if ($details) {
    echo "FOUND in /details endpoint! rating=" . $details->rating . ", comment=" . $details->feedback_comment . "\n";
} else {
    echo "ERROR: Missing from details endpoint!\n";
}
