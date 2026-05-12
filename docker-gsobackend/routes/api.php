<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\MaintenanceRequestController;
use App\Http\Controllers\TransportationRequestController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\MaintenanceTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\OfficeController;
use App\Http\Controllers\StatusController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ScheduleEventController;
use App\Http\Controllers\PushTokenController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\LoginLocationController;
use App\Http\Controllers\SmsDeliveryController;
use App\Http\Controllers\AIAssistantController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\ForgotPasswordController;

use App\Models\MaintenanceType;

// Google Authentication (Public)
Route::post('/auth/google/verify',           [GoogleAuthController::class, 'verifyGoogleToken']);
Route::get('/auth/check-username',           [GoogleAuthController::class, 'checkUsernameAvailability']);
Route::post('/auth/google/register',         [GoogleAuthController::class, 'registerWithGoogle']);


Route::get('/maintenance-requests/list-with-details', [MaintenanceRequestController::class, 'indexWithDetails']);

// Public Routes (Authentication) Forgot password implementation
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
//Route::post('/logout', [UserController::class, 'logout']);

Route::middleware('auth:sanctum')->post('/logout', [UserController::class, 'logout']);

//for test only
Route::get('/message', function(){
    return "hehehe";
});
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::post('/test-register', function () {
    return response()->json(['message' => 'Register route is working!']);
});


//for staffs, head, campus director
//staff fills up the remaining fields and verifies it
Route::middleware(['auth:sanctum'])->put('/maintenance-requests/{id}/verify', [MaintenanceRequestController::class, 'verify']);


// Route::middleware(['auth:sanctum'])->put('/maintenance-requests/{id}/approve', [MaintenanceRequestController::class, 'approve']);


// need approval of head and director
Route::middleware(['auth:sanctum'])->group(function () {
    Route::put('/maintenance-requests/{id}/approve-head', [MaintenanceRequestController::class, 'approveByHead']);
    Route::put('/maintenance-requests/{id}/approve-director', [MaintenanceRequestController::class, 'approveByDirector']);
});
//staff assigns a priority
Route::middleware(['auth:sanctum'])->put('/maintenance-requests/{id}/assign-priority', [MaintenanceRequestController::class, 'assignPriority']);

//staff assigns schedule
Route::middleware(['auth:sanctum'])->post('/maintenance-requests/{id}/assign-schedule', [MaintenanceRequestController::class, 'assignSchedule']);


//dissaproved
Route::middleware(['auth:sanctum'])->put('/maintenance-requests/{id}/disapprove', [MaintenanceRequestController::class, 'disapprove']);

//staff would get the maintenance request filled by the requester
Route::middleware(['auth:sanctum'])->get('/staffpov/{id}', [MaintenanceRequestController::class, 'staffpov']);
//staff would know used numbers for setting priority numbers
Route::middleware(['auth:sanctum'])->get('/maintenance-requests/priority-numbers', [MaintenanceRequestController::class, 'getUsedPriorityNumbers']);
// Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/maintenance-requests', [MaintenanceRequestController::class, 'index']);
// });

//denies the request by a staff
Route::middleware(['auth:sanctum'])->put('/maintenance-requests/{id}/deny', [MaintenanceRequestController::class, 'denyRequest']);

//saves the date and time the moment a staff views a request
Route::middleware(['auth:sanctum'])->put('/maintenance-requests/{id}/view', [MaintenanceRequestController::class, 'autosaveDateTime']);



//for schedules
Route::middleware(['auth:sanctum'])->get('/schedules', [MaintenanceRequestController::class, 'getSchedules']);

//shared schedule events
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/schedule-events', [ScheduleEventController::class, 'index']);
    Route::post('/schedule-events', [ScheduleEventController::class, 'store']);
    Route::put('/schedule-events/{id}', [ScheduleEventController::class, 'update']);
    Route::delete('/schedule-events/{id}', [ScheduleEventController::class, 'destroy']);
});

//getfullname
Route::get('/users/{id}/fullname', [UserController::class, 'getFullName'])
    ->middleware('auth:sanctum');
//gets the id and fullname
Route::get('/users/idfullname', [UserController::class, 'getAuthenticatedUserInfo'])
    ->middleware('auth:sanctum');

//gets the id,fullname, office, position, contactnumber
Route::middleware(['auth:sanctum'])->get('/users/reqInfo', [UserController::class, 'getUserDetails']);

Route::middleware(['auth:sanctum'])->get('/users/userWithRole', [UserController::class, 'getUserDetailRole']);

// Mobile App Expo Push Token Registration
Route::middleware(['auth:sanctum'])->post('/users/push-token', [PushTokenController::class, 'store']);

//head would get the maintenance request filled by the requester and staff
Route::middleware(['auth:sanctum'])->get('/headpov/{id}', [MaintenanceRequestController::class, 'headpov']);
Route::middleware(['auth:sanctum'])->get('/directorpov/{id}', [MaintenanceRequestController::class, 'directorpov']);






//admin approval of account
Route::middleware('auth:sanctum')->group(function () {
    //admin approves the account of user
    Route::put('/users/{id}/updateAccountStatus', [UserController::class, 'updateAccountStatus']);
    //admin rejects the account of user
    Route::put('/users/{id}/dissaproveAccountStatus', [UserController::class, 'rejectAccountStatus']);
    //gets all pending approvals
    Route::get('/pending-approvals', [UserController::class, 'getPendingApprovals']);
    Route::get('/uspass', [UserController::class, 'getUsPass']);
    //admin deletes a user account (soft delete - preserves historical data)
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Login Locations
    Route::get('/settings', [SystemSettingController::class, 'getSettings']);
    Route::post('/settings/toggle-location-tracking', [SystemSettingController::class, 'toggleLoginLocationTracking']);
    Route::get('/login-locations', [LoginLocationController::class, 'index']);
    
    // SMS Deliveries
    Route::get('/sms-deliveries', [SmsDeliveryController::class, 'index']);
});



//users feedback
Route::middleware(['auth:sanctum'])->post('/feedback', [FeedbackController::class, 'store']);
//get the details of the feedback
Route::middleware('auth:sanctum')->get('/feedbacks/{id}/details', [FeedbackController::class, 'showFeedbackDetails']);
Route::get('/feedbacks/{id}', [FeedbackController::class, 'show']);
Route::get('/feedbacks/request/{maintenance_request_id}', [FeedbackController::class, 'getByRequest']);

Route::middleware('auth:sanctum')->get('/feedbacks', [FeedbackController::class, 'index']);


//create maintenancerequestform Admin can edit maintenance types
Route::middleware('auth:sanctum')->group(function () {
    // Maintenance Requests
    Route::apiResource('/maintenance-requests', MaintenanceRequestController::class);
    Route::apiResource('/maintenance-types', MaintenanceTypeController::class);

    // AI Assistant
    Route::post('/ai-assist', [AIAssistantController::class, 'assist']);
});

Route::get('/maintenance-requests/{id}/request-date', [MaintenanceRequestController::class, 'getRequestDate']);









//this section is for the non functional requirements



//cancels the request
Route::put('/maintenance-requests/{id}/cancel', [MaintenanceRequestController::class, 'cancelRequest']);


//edit request form
Route::middleware('auth:sanctum')->put('/maintenance-requests/{id}/editDetails', [MaintenanceRequestController::class, 'updateDetails']);

//edit user info
Route::middleware('auth:sanctum')->put('/profile/update', [UserController::class, 'updateProfile']);

//return all user's info
Route::middleware('auth:sanctum')->get('/profile/userInfos', [UserController::class, 'userDetails']);


//for notifications
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unreadCount', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/markAsRead/{id}', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/markAllAsRead', [NotificationController::class, 'markAllAsRead']);
});


//can get, create, edit, delete roles, position, office, status, maintenance-types
Route::apiResource('roles', RoleController::class);
Route::apiResource('positions', PositionController::class);
Route::apiResource('offices', OfficeController::class);
Route::apiResource('statuses', StatusController::class);


Route::middleware('auth:sanctum')->group(function () {
    Route::put('/maintenance-requests/{id}/mark-urgent', [MaintenanceRequestController::class, 'markAsUrgent']);
    Route::put('/maintenance-requests/{id}/mark-onhold', [MaintenanceRequestController::class, 'markAsOnHold']);
    Route::put('/maintenance-requests/{id}/mark-done', [MaintenanceRequestController::class, 'markAsDone']);
});








//translated datas

Route::get('/common-datas', [UserController::class, 'commonDatas']);
Route::get('/forPriority', [MaintenanceRequestController::class, 'forPriorityNumber']);
Route::get('/accountStatuses', [StatusController::class, 'accountStatuses']);
Route::get('/users-list', [UserController::class, 'usersList']);


//for comments

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/comments', [CommentController::class, 'index']);
    Route::post('/comment', [CommentController::class, 'store']);
    Route::get('/comments/{id}', [CommentController::class, 'show']);
    Route::put('/comments/{id}', [CommentController::class, 'update']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);
    Route::get('/requests/{id}/comments-by-request', [CommentController::class, 'commentsByRequest']);
});

Route::get('/statusesPovDirector', [StatusController::class, 'statusesPovDirector']);
Route::get('/statusesPovHead', [StatusController::class, 'statusesPovHead']);


Route::get('/generate-priority-number/{maintenanceTypeId}', [MaintenanceRequestController::class, 'generatePriorityNumber']);










