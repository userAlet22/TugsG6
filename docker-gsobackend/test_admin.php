<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Mock an Admin user
$admin = User::where('role_id', 1)->first();
if (!$admin) {
    die("No admin found\n");
}
Auth::login($admin);

// Hit the endpoint
$request = Request::create('/api/feedbacks', 'GET');
$response = app()->handle($request);

echo "HTTP Code: " . $response->getStatusCode() . "\n";
echo "Response Body:\n";
echo json_encode(json_decode($response->getContent()), JSON_PRETTY_PRINT);
