<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create(
    '/api/ai-assist',
    'POST',
    [
        'message' => 'Why is the aircon dripping water?',
        'form_data' => ['details' => 'It started dripping yesterday.']
    ]
);
$controller = new App\Http\Controllers\AIAssistantController();
$response = $controller->assist($request);
echo $response->getContent();
