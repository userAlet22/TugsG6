<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\SmsDelivery;

class SmsDeliveryController extends Controller
{
    public function index(Request $request)
    {
        // Admin only functionality (assumed guarded by auth/role middleware in routes)
        $limit = $request->query('limit', 50);

        $deliveries = SmsDelivery::with(['user' => function ($query) {
                $query->select('id', 'first_name', 'last_name', 'contact_number');
            }, 'notification'])
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        return response()->json($deliveries);
    }
}
