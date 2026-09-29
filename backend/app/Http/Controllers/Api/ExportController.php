<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExportAllRequest;
use App\Http\Requests\ExportRequest;
use App\Services\ExportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function __construct(private ExportService $service) {}

    public function excel(ExportRequest $request): BinaryFileResponse
    {
        $export = $this->service->transactionsExcel(
            $request->user(), $request->period(), $request->filters(), $request->sort(), $request->dir(),
        );

        return Excel::download($export, $this->filename('pidu-transaksi', 'xlsx'));
    }

    public function pdf(ExportRequest $request): Response
    {
        $user = $request->user();
        $period = $request->period();
        $filters = $request->filters();

        $count = $this->service->countTransactions($user, $period, $filters);
        if ($count > ExportService::PDF_MAX_ROWS) {
            throw ValidationException::withMessages([
                'export' => __('messages.pdf_limit', [
                    'max' => number_format(ExportService::PDF_MAX_ROWS, 0, ',', '.'),
                    'count' => number_format($count, 0, ',', '.'),
                ]),
            ]);
        }

        $data = $this->service->transactionsPdfData(
            $user, $period, $filters, $request->sort(), $request->dir(), $request->filterSummary(),
        );

        return Pdf::loadView('exports.transactions-pdf', $data)
            // Subsetting: hanya glyph yang dipakai yang di-embed (tanpa ini ±900 KB per file).
            ->setOption('isFontSubsettingEnabled', true)
            ->setPaper('a4')
            ->download($this->filename('pidu-transaksi', 'pdf'));
    }

    public function all(ExportAllRequest $request): BinaryFileResponse
    {
        $year = $request->year();

        return Excel::download(
            $this->service->allData($request->user(), $year),
            $this->filename("pidu-semua-{$year}", 'xlsx'),
        );
    }

    private function filename(string $prefix, string $extension): string
    {
        return sprintf('%s-%s.%s', $prefix, now()->format('Ymd-His'), $extension);
    }
}
