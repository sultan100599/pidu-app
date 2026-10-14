<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecurringRequest;
use App\Http\Requests\UpdateRecurringRequest;
use App\Http\Resources\RecurringResource;
use App\Services\RecurringService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class RecurringController extends Controller
{
    public function __construct(private RecurringService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return RecurringResource::collection(
            $request->user()->recurringTransactions()
                ->with('category', 'wallet')
                ->orderByDesc('is_active')
                ->orderBy('next_date')
                ->orderBy('id')
                ->get()
        );
    }

    /**
     * Jadwal yang sudah lewat atau jatuh hari ini langsung dicatat.
     */
    public function store(StoreRecurringRequest $request, WalletService $wallets): JsonResponse
    {
        $user = $request->user();
        $data = $request->payload();
        $data['wallet_id'] ??= $wallets->primaryFor($user)->id;
        $data['next_date'] = $data['start_date'];

        [$rule, $created] = DB::transaction(function () use ($user, $data) {
            $rule = $user->recurringTransactions()->create($data);

            return [$rule, $this->service->run($rule)];
        });

        return response()->json([
            'message' => $created > 0
                ? __('messages.recurring_created_now', ['count' => $created])
                : __('messages.recurring_created'),
            'created' => $created,
            'data' => new RecurringResource($rule->refresh()->load('category', 'wallet')),
        ], 201);
    }

    public function update(UpdateRecurringRequest $request): JsonResponse
    {
        $rule = $request->recurring();
        $rule->update($request->payload());

        return response()->json([
            'message' => __('messages.recurring_updated'),
            'data' => new RecurringResource($rule->load('category', 'wallet')),
        ]);
    }

    /**
     * Jeda / jalankan lagi. Jadwal yang terlewat selama dijeda tidak dibuat.
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $rule = $request->user()->recurringTransactions()->findOrFail($id);

        if ($rule->is_active) {
            $rule->update(['is_active' => false]);
            $created = 0;
        } else {
            $this->service->resume($rule);
            $created = $this->service->run($rule);
        }

        return response()->json([
            'message' => __($rule->is_active ? 'messages.recurring_resumed' : 'messages.recurring_paused'),
            'created' => $created,
            'data' => new RecurringResource($rule->refresh()->load('category', 'wallet')),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->recurringTransactions()->findOrFail($id)->delete();

        return response()->json(['message' => __('messages.recurring_deleted')]);
    }
}
