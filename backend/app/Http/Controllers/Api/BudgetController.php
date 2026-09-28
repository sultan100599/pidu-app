<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PeriodRequest;
use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function __construct(private BudgetService $service) {}

    public function index(PeriodRequest $request): JsonResponse
    {
        $period = $request->period();
        $month = $period->end->month;
        $year = $period->end->year;
        $budgets = $this->service->forMonth($request->user(), $month, $year);

        return response()->json([
            'month' => $month,
            'year' => $year,
            'data' => BudgetResource::collection($budgets),
            'totals' => $this->service->totals($budgets),
        ]);
    }

    public function store(StoreBudgetRequest $request): JsonResponse
    {
        $budget = $request->user()->budgets()->create($request->validated());

        return response()->json([
            'message' => 'Budget berhasil ditambahkan.',
            'data' => new BudgetResource($this->service->withUsage($request->user(), $budget)),
        ], 201);
    }

    public function update(UpdateBudgetRequest $request): JsonResponse
    {
        $budget = $request->budget();
        $budget->update($request->validated());

        return response()->json([
            'message' => 'Budget berhasil diperbarui.',
            'data' => new BudgetResource($this->service->withUsage($request->user(), $budget)),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->budgets()->findOrFail($id)->delete();

        return response()->json(['message' => 'Budget berhasil dihapus.']);
    }
}
