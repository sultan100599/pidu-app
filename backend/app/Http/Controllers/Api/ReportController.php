<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodRequest;
use App\Services\ReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    public function __construct(private ReportService $service) {}

    public function daily(PeriodRequest $request): JsonResponse
    {
        return response()->json($this->service->daily($request->user(), $request->period(), $request->filters()));
    }

    public function weekly(PeriodRequest $request): JsonResponse
    {
        return response()->json($this->service->weekly($request->user(), $request->period(), $request->filters()));
    }

    public function monthly(PeriodRequest $request): JsonResponse
    {
        $year = (int) ($request->validated('year') ?? CarbonImmutable::today()->year);

        return response()->json($this->service->monthly($request->user(), $year, $request->filters()));
    }

    public function yearly(PeriodRequest $request): JsonResponse
    {
        return response()->json($this->service->yearly($request->user(), $request->filters()));
    }

    public function calendar(PeriodRequest $request): JsonResponse
    {
        $today = CarbonImmutable::today();
        $year = (int) ($request->validated('year') ?? $today->year);
        $month = (int) ($request->validated('month') ?? $today->month);

        return response()->json($this->service->calendar($request->user(), $year, $month, $request->filters()));
    }

    public function day(PeriodRequest $request, string $date): JsonResponse
    {
        Validator::make(['date' => $date], ['date' => ['date_format:Y-m-d']], [
            'date_format' => 'Tanggal harus berformat Y-m-d.',
        ])->validate();

        return response()->json($this->service->day($request->user(), $date, $request->filters()));
    }
}
