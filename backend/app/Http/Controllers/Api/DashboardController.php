<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodRequest;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(PeriodRequest $request, DashboardService $service): JsonResponse
    {
        return response()->json($service->build($request->user(), $request->period(), $request->filters()));
    }
}
