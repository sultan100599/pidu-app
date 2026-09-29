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
        return Excel::download(new ImportTemplateExport($request->user()), 'pidu-template-impor.xlsx');
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
                'message' => "Masih ada {$result['invalid']} baris bermasalah. Perbaiki file lalu coba lagi.",
                'errors' => ['file' => ["Masih ada {$result['invalid']} baris bermasalah."]],
                'data' => $result,
            ], 422);
        }

        $done = $this->service->commit($user, $rows, $request->skipDuplicates());

        $message = "{$done['imported']} transaksi berhasil diimpor.";
        if ($done['skipped_duplicates'] > 0) {
            $message .= " {$done['skipped_duplicates']} duplikat dilewati.";
        }
        if ($done['new_categories'] > 0) {
            $message .= " {$done['new_categories']} kategori baru dibuat.";
        }

        return response()->json(['message' => $message, 'data' => $done], 201);
    }
}
