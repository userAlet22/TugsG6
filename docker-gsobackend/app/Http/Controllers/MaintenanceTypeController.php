<?php


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MaintenanceType;
use Illuminate\Support\Facades\Auth;

class MaintenanceTypeController extends Controller
{
    public function index()
    {
        return response()->json(MaintenanceType::all(), 200);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role_id !== 1) {
            return response()->json(['message' => 'Only Admins can add maintenance types.'], 403);
        }

        $request->validate(['type_name' => 'required|string|unique:maintenance_types']);

        $type = MaintenanceType::create(['type_name' => $request->type_name]);

        return response()->json([
            'message' => 'Maintenance type successfully added.',
            'data' => $type
        ], 201);
    }

    public function show($id)
    {
        $type = MaintenanceType::find($id);
        if (!$type) {
            return response()->json(['message' => 'Maintenance type not found'], 404);
        }

        return response()->json($type, 200);
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->role_id !== 1) {
            return response()->json(['message' => 'Only Admins can edit maintenance types.'], 403);
        }

        $type = MaintenanceType::find($id);
        if (!$type) {
            return response()->json(['message' => 'Maintenance type not found'], 404);
        }

        $request->validate(['type_name' => 'required|string|unique:maintenance_types,type_name,' . $id]);

        $type->update(['type_name' => $request->type_name]);

        return response()->json([
            'message' => 'Maintenance type successfully updated.',
            'data' => $type
        ], 200);
    }

    public function destroy($id)
    {
        if (Auth::user()->role_id !== 1) {
            return response()->json(['message' => 'Only Admins can delete maintenance types.'], 403);
        }

        $type = MaintenanceType::find($id);
        if (!$type) {
            return response()->json(['message' => 'Maintenance type not found'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Maintenance type successfully removed.'], 200);
    }
}
