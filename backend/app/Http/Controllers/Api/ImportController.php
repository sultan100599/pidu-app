<?php

namespace App\Http\Controllers\Api;

use App\Exports\ImportTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\ImportRequest;
use App\Services\Import\TransactionImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ImportController extends Controller
{
    public function __construct(private TransactionImportService $service) {}

    public function template(Request $request): BinaryFileResponse
    {
        return Excel::download(new ImportTemplateExport($request->user()), 'pidu-template-unggah.xlsx');
    }

    /**
     * dry_run=1 → hanya analisis. dry_run=0 → simpan (ditolak jika masih ada baris bermasalah).
     */
    public function transactions(ImportRequest $request): JsonResponse
    {
        $user = $request->user();
        ['result' => $result, 'rows' => $rows] = $this->service->analyze($user, $request->file('file'));

        if ($request->dryRun()) {
            return response()->json(['data' => $result]);
        }

        if ($result['invalid'] > 0) {
            return response()->json([
                'message' => __('messages.invalid_rows', ['count' => $result['invalid']]),
                'errors' => ['file' => [__('messages.invalid_rows_short', ['count' => $result['invalid']])]],
                'data' => $result,
            ], 422);
        }

        $done = $this->service->commit($user, $rows, $request->skipDuplicates());

        $message = __('messages.imported', ['count' => $done['imported']]);
        if ($done['skipped_duplicates'] > 0) {
            $message .= ' '.__('messages.duplicates_skipped', ['count' => $done['skipped_duplicates']]);
        }
        if ($done['new_categories'] > 0) {
            $message .= ' '.__('messages.categories_created', ['count' => $done['new_categories']]);
        }

        return response()->json(['message' => $message, 'data' => $done], 201);
    }
}
