<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Backup:
 * - per user: xlsx berisi SEMUA transaksi (format sama dengan export → bisa diimpor ulang)
 *   di {path}/users/{id}/pidu-backup-YYYYMMDD-HHmmss.xlsx
 * - database (SQLite saja): snapshot konsisten via VACUUM INTO di {path}/database/
 * Masing-masing folder hanya menyimpan N file terbaru.
 */
class BackupService
{
    public const USER_FILE_PATTERN = '/^pidu-backup-\d{8}-\d{6}\.xlsx$/';

    public function __construct(private ExportService $exports) {}

    public function userDir(User $user): string
    {
        return $this->root().DIRECTORY_SEPARATOR.'users'.DIRECTORY_SEPARATOR.$user->id;
    }

    /**
     * @return array{name: string, size: int, created_at: string}
     */
    public function backupUser(User $user): array
    {
        $dir = $this->userDir($user);
        File::ensureDirectoryExists($dir);

        $name = 'pidu-backup-'.now()->format('Ymd-His').'.xlsx';
        $export = $this->exports->transactionsExcel($user, null, [], 'transaction_date', 'asc');
        File::put($dir.DIRECTORY_SEPARATOR.$name, Excel::raw($export, ExcelFormat::XLSX));

        $this->prune($dir, '*.xlsx');

        return $this->describe($dir.DIRECTORY_SEPARATOR.$name);
    }

    /**
     * Snapshot database. Hanya SQLite (VACUUM INTO → file konsisten walau app sedang dipakai).
     * Driver lain → null (gunakan tool backup database masing-masing, mis. mysqldump).
     */
    public function backupDatabase(): ?string
    {
        if (DB::getDriverName() !== 'sqlite') {
            return null;
        }

        $dir = $this->root().DIRECTORY_SEPARATOR.'database';
        File::ensureDirectoryExists($dir);
        $target = $dir.DIRECTORY_SEPARATOR.'database-'.now()->format('Ymd-His').'.sqlite';
        if (File::exists($target)) {
            File::delete($target);
        }

        if (DB::transactionLevel() > 0) {
            throw new \RuntimeException('Snapshot database tidak bisa dibuat di dalam transaksi (SQLite menolak VACUUM).');
        }
        DB::statement('VACUUM INTO ?', [$target]);
        $this->prune($dir, '*.sqlite');

        return $target;
    }

    /**
     * Daftar backup milik user, terbaru dulu.
     *
     * @return list<array{name: string, size: int, created_at: string}>
     */
    public function list(User $user): array
    {
        $dir = $this->userDir($user);
        if (! File::isDirectory($dir)) {
            return [];
        }

        return collect(File::glob($dir.DIRECTORY_SEPARATOR.'*.xlsx'))
            ->filter(fn ($path) => preg_match(self::USER_FILE_PATTERN, basename($path)))
            ->sortDesc()
            ->map(fn ($path) => $this->describe($path))
            ->values()
            ->all();
    }

    /**
     * Path file backup milik user. Nama divalidasi ketat (tanpa path traversal); selain itu → 404.
     */
    public function path(User $user, string $name): string
    {
        $path = $this->userDir($user).DIRECTORY_SEPARATOR.$name;
        if (! preg_match(self::USER_FILE_PATTERN, $name) || ! File::isFile($path)) {
            throw new NotFoundHttpException;
        }

        return $path;
    }

    private function root(): string
    {
        return rtrim(config('pidu.backup.path'), '\\/');
    }

    private function prune(string $dir, string $pattern): void
    {
        $keep = max(1, (int) config('pidu.backup.keep'));
        $files = collect(File::glob($dir.DIRECTORY_SEPARATOR.$pattern))->sortDesc()->values();
        $files->slice($keep)->each(fn ($path) => File::delete($path));
    }

    private function describe(string $path): array
    {
        // Waktu dari nama file (…-YYYYMMDD-HHmmss.ext), bukan mtime (bisa berubah saat file disalin).
        preg_match('/(\d{8}-\d{6})/', basename($path), $m);

        return [
            'name' => basename($path),
            'size' => File::size($path),
            'created_at' => CarbonImmutable::createFromFormat('Ymd-His', $m[1])->toIso8601String(),
        ];
    }
}
