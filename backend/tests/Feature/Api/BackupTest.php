<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class BackupTest extends TestCase
{
    // Bukan RefreshDatabase: SQLite menolak VACUUM di dalam transaksi pembungkus tes.
    use DatabaseMigrations;

    private string $root;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-15 10:00:00');
        $this->root = sys_get_temp_dir().DIRECTORY_SEPARATOR.'pidu-backup-test-'.uniqid();
        config(['pidu.backup.path' => $this->root, 'pidu.backup.keep' => 3]);

        $this->user = User::factory()->create();
        $food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        Transaction::factory()->create(['user_id' => $this->user->id, 'category_id' => $food->id, 'transaction_date' => '2026-01-05', 'amount' => 10000, 'description' => 'Lama']);
        Transaction::factory()->create(['user_id' => $this->user->id, 'category_id' => $food->id, 'transaction_date' => '2026-09-01', 'amount' => 20000, 'description' => 'Baru']);
    }

    private function usesSqlite(): bool
    {
        return DB::getDriverName() === 'sqlite';
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->root);
        parent::tearDown();
    }

    public function test_command_creates_database_snapshot_and_user_workbooks(): void
    {
        $other = User::factory()->create();
        Transaction::factory()->create(['user_id' => $other->id, 'amount' => 777]);

        $this->artisan('pidu:backup')->assertSuccessful();

        $snapshots = File::glob($this->root.'/database/*.sqlite');
        if ($this->usesSqlite()) {
            $this->assertCount(1, $snapshots);
            $this->assertStringStartsWith('SQLite format 3', file_get_contents($snapshots[0], false, null, 0, 15));
        } else {
            // Snapshot hanya untuk SQLite; driver lain memakai tool backup database-nya sendiri.
            $this->assertCount(0, $snapshots);
        }

        $mine = File::glob($this->root."/users/{$this->user->id}/*.xlsx");
        $this->assertCount(1, $mine);
        $this->assertSame('pidu-backup-20260915-100000.xlsx', basename($mine[0]));

        // Semua tanggal (bukan hanya bulan ini), urut naik, hanya milik user ini.
        $sheet = IOFactory::load($mine[0])->getSheetByName('Transaksi');
        $this->assertSame('Lama', $sheet->getCell('D2')->getValue());
        $this->assertSame('Baru', $sheet->getCell('D3')->getValue());
        $this->assertNull($sheet->getCell('A4')->getValue());

        $this->assertCount(1, File::glob($this->root."/users/{$other->id}/*.xlsx"));
    }

    public function test_command_for_single_user_skips_database_snapshot(): void
    {
        $this->artisan('pidu:backup', ['--user' => $this->user->id])->assertSuccessful();

        $this->assertFalse(File::isDirectory($this->root.'/database'));
        $this->assertCount(1, File::glob($this->root."/users/{$this->user->id}/*.xlsx"));
    }

    public function test_retention_keeps_latest_files(): void
    {
        foreach (range(1, 5) as $i) {
            $this->travel(1)->minutes();
            $this->artisan('pidu:backup')->assertSuccessful();
        }

        $files = collect(File::glob($this->root."/users/{$this->user->id}/*.xlsx"))->map(fn ($p) => basename($p))->sort()->values();
        $this->assertSame(['pidu-backup-20260915-100300.xlsx', 'pidu-backup-20260915-100400.xlsx', 'pidu-backup-20260915-100500.xlsx'], $files->all());
        $this->assertCount($this->usesSqlite() ? 3 : 0, File::glob($this->root.'/database/*.sqlite'));
    }

    public function test_backup_file_can_be_reimported_as_duplicates(): void
    {
        $this->artisan('pidu:backup', ['--user' => $this->user->id])->assertSuccessful();
        $path = File::glob($this->root."/users/{$this->user->id}/*.xlsx")[0];
        Sanctum::actingAs($this->user);

        $this->post('/api/import/transactions', ['file' => new UploadedFile($path, 'backup.xlsx', null, null, true)], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.total_rows', 2)
            ->assertJsonPath('data.invalid', 0)
            ->assertJsonPath('data.duplicates', 2)
            ->assertJsonPath('data.to_import', 0);
    }

    public function test_api_list_create_and_download(): void
    {
        Sanctum::actingAs($this->user);

        $this->getJson('/api/backups')->assertOk()->assertJsonPath('data', [])->assertJsonPath('keep', 3);

        $this->postJson('/api/backups')
            ->assertCreated()
            ->assertJsonPath('message', 'Cadangan berhasil dibuat.')
            ->assertJsonPath('data.name', 'pidu-backup-20260915-100000.xlsx');

        $this->getJson('/api/backups')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.created_at', '2026-09-15T10:00:00+07:00');

        $response = $this->get('/api/backups/pidu-backup-20260915-100000.xlsx')->assertOk();
        $this->assertStringContainsString('pidu-backup-20260915-100000.xlsx', $response->headers->get('content-disposition'));
    }

    public function test_cannot_access_other_users_backups_or_arbitrary_files(): void
    {
        $other = User::factory()->create();
        $this->artisan('pidu:backup', ['--user' => $other->id])->assertSuccessful();
        Sanctum::actingAs($this->user);

        // file milik user lain (nama valid) → 404, dan tidak muncul di daftar
        $this->getJson('/api/backups/pidu-backup-20260915-100000.xlsx')->assertNotFound();
        $this->getJson('/api/backups')->assertJsonPath('data', []);

        // nama tidak sesuai pola / path traversal → 404
        foreach (['..%2F..%2F.env', 'database.sqlite', 'pidu-backup-1.xlsx'] as $name) {
            $this->getJson("/api/backups/{$name}")->assertNotFound();
        }
    }

    public function test_backup_is_scheduled_daily(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('pidu:backup')->assertSuccessful();
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/backups')->assertStatus(401);
        $this->postJson('/api/backups')->assertStatus(401);
    }
}
