<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Backup milik user yang sedang login (hanya folder miliknya sendiri).
 */
class BackupController extends Controller
{
    public function __construct(private BackupService $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->list($request->user()),
            'keep' => (int) config('pidu.backup.keep'),
            'schedule' => config('pidu.backup.time'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'message' => __('messages.backup_created'),
            'data' => $this->service->backupUser($request->user()),
        ], 201);
    }

    public function download(Request $request, string $name): BinaryFileResponse
    {
        return response()->download($this->service->path($request->user(), $name), $name);
    }
}
