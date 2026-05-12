<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$idsToDelete = [22, 23, 24, 25, 27, 28, 54, 55, 56, 91, 57, 68, 63, 64, 67, 76, 73, 74, 75, 78, 79, 80];
$deleted = 0;
$notFound = 0;

echo "Attempting to force delete the following IDs: " . implode(', ', $idsToDelete) . "\n";

foreach ($idsToDelete as $id) {
    $user = User::withTrashed()->find($id);
    if ($user) {
        $user->forceDelete();
        $deleted++;
    } else {
        $notFound++;
    }
}

echo "Successfully force deleted: $deleted accounts.\n";
if ($notFound > 0) {
    echo "Could not find (already deleted): $notFound accounts.\n";
}
