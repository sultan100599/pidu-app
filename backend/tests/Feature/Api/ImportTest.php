<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use RefreshDatabase;

    private const HEADER = ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Catatan', 'Metode', 'Nominal'];

    private User $user;

    private Category $food;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-15 10:00:00');
        $this->user = User::factory()->create();
        $this->food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        Category::factory()->income()->create(['user_id' => $this->user->id, 'name' => 'Gaji']);
        Sanctum::actingAs($this->user);
    }

    /**
     * Buat file xlsx dari baris (baris pertama = header).
     */
    private function xlsx(array $rows, string $name = 'impor.xlsx'): UploadedFile
    {
        $book = new Spreadsheet;
        $book->getActiveSheet()->fromArray($rows, null, 'A1', true);
        $path = tempnam(sys_get_temp_dir(), 'imp').'.xlsx';
        IOFactory::createWriter($book, 'Xlsx')->save($path);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function import(UploadedFile $file, array $params = [])
    {
        return $this->post('/api/import/transactions', ['file' => $file, ...$params], ['Accept' => 'application/json']);
    }

    public function test_dry_run_reports_valid_invalid_and_new_categories_without_writing(): void
    {
        $file = $this->xlsx([
            self::HEADER,
            [ExcelDate::stringToExcel('2026-09-01'), 'Pengeluaran', 'makanan', 'Nasi', null, 'QRIS', 25000],     // kategori ada (case-insensitive)
            ['02/09/2026', 'Pemasukan', 'Gaji', 'Gaji', null, 'Transfer', 'Rp 8.500.000'],                     // teks tanggal & nominal
            ['2026-09-03', '', 'Kopi', 'Kopi', null, '', -18000.5],                                            // jenis kosong + negatif → pengeluaran, kategori baru
            [null, null, null, null, null, null, null],                                                        // baris kosong
            ['31/02/2026', 'Pengeluaran', 'Makanan', null, null, 'Bitcoin', 0],                                 // 3 error
            ['2026-09-04', 'Sedekah', '', null, null, null, 'abc'],                                             // jenis, kategori, nominal salah
        ]);

        $response = $this->import($file)->assertOk();

        $response->assertJsonPath('data.total_rows', 5)
            ->assertJsonPath('data.valid', 3)
            ->assertJsonPath('data.invalid', 2)
            ->assertJsonPath('data.to_import', 3)
            ->assertJsonPath('data.income', 8500000)
            ->assertJsonPath('data.expense', 43000.5)
            ->assertJsonPath('data.new_categories', [['name' => 'Kopi', 'type' => 'expense']])
            ->assertJsonPath('data.errors.0.row', 6)
            ->assertJsonPath('data.preview.2.transaction_date', '2026-09-03')
            ->assertJsonPath('data.preview.2.type', 'expense')
            ->assertJsonPath('data.preview.2.payment_method', 'cash');

        $this->assertCount(3, $response->json('data.errors.0.messages'));
        $this->assertContains('Jenis harus Pemasukan atau Pengeluaran.', $response->json('data.errors.1.messages'));
        $this->assertSame(0, Transaction::count());
        $this->assertSame(2, Category::count());
    }

    public function test_commit_is_rejected_while_rows_are_invalid(): void
    {
        $file = $this->xlsx([self::HEADER, ['2026-09-01', 'Pengeluaran', 'Makanan', null, null, null, 1000], ['x', 'Pengeluaran', 'Makanan', null, null, null, 1000]]);

        $this->import($file, ['dry_run' => 0])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Masih ada 1 baris bermasalah. Perbaiki file lalu coba lagi.')
            ->assertJsonPath('data.errors.0.row', 3);

        $this->assertSame(0, Transaction::count());
    }

    public function test_commit_imports_rows_and_creates_categories(): void
    {
        $file = $this->xlsx([
            self::HEADER,
            ['2026-09-01', 'Pengeluaran', 'Makanan', 'Nasi', null, 'QRIS', 25000],
            ['2026-09-02', 'Pengeluaran', 'Kopi', 'Kopi susu', 'pagi', 'E-Wallet', 18000],
            ['2026-09-02', 'Pemasukan', 'Bonus Proyek', null, null, 'Transfer', 1000000],
        ]);

        $this->import($file, ['dry_run' => 0])
            ->assertCreated()
            ->assertJsonPath('message', '3 transaksi berhasil diimpor. 2 kategori baru dibuat.')
            ->assertJsonPath('data.imported', 3);

        $this->assertSame(3, $this->user->transactions()->count());
        $kopi = $this->user->categories()->where('name', 'Kopi')->firstOrFail();
        $this->assertSame('expense', $kopi->type->value);
        $this->assertDatabaseHas('transactions', [
            'user_id' => $this->user->id, 'category_id' => $kopi->id, 'transaction_date' => '2026-09-02',
            'payment_method' => 'e_wallet', 'notes' => 'pagi', 'amount' => 18000,
        ]);

        // angka langsung muncul di laporan
        $this->getJson('/api/dashboard?year=2026&month=9')
            ->assertJsonPath('summary.expense', 43000)
            ->assertJsonPath('summary.income', 1000000);
    }

    public function test_reimporting_an_export_skips_duplicates(): void
    {
        Transaction::factory()->create(['user_id' => $this->user->id, 'category_id' => $this->food->id, 'transaction_date' => '2026-09-01', 'amount' => 25000, 'description' => 'Nasi']);
        Transaction::factory()->create(['user_id' => $this->user->id, 'category_id' => $this->food->id, 'transaction_date' => '2026-09-01', 'amount' => 25000, 'description' => 'Nasi']);

        // Export → file berisi 2 transaksi + baris kosong + 3 baris total
        $export = $this->get('/api/export/excel')->assertOk();
        $path = tempnam(sys_get_temp_dir(), 'exp').'.xlsx';
        copy($export->baseResponse->getFile()->getPathname(), $path);
        $file = new UploadedFile($path, 'export.xlsx', null, null, true);

        $this->import($file)
            ->assertOk()
            ->assertJsonPath('data.total_rows', 2)   // baris total diabaikan
            ->assertJsonPath('data.invalid', 0)
            ->assertJsonPath('data.duplicates', 2)
            ->assertJsonPath('data.to_import', 0);

        // file dengan 3 baris kembar: 2 sudah ada, 1 baru (dihitung per kemunculan)
        $three = $this->xlsx([self::HEADER, ...array_fill(0, 3, ['2026-09-01', 'Pengeluaran', 'Makanan', 'Nasi', null, 'Cash', 25000])]);
        $this->import($three, ['dry_run' => 0])
            ->assertCreated()
            ->assertJsonPath('message', '1 transaksi berhasil diimpor. 2 duplikat dilewati.');
        $this->assertSame(3, Transaction::count());

        // skip_duplicates=0 → semua diimpor
        $this->import($this->xlsx([self::HEADER, ['2026-09-01', 'Pengeluaran', 'Makanan', 'Nasi', null, 'Cash', 25000]]), ['dry_run' => 0, 'skip_duplicates' => 0])
            ->assertCreated();
        $this->assertSame(4, Transaction::count());
    }

    public function test_csv_with_semicolon_is_supported(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'csv').'.csv';
        file_put_contents($path, "Tanggal;Jenis;Kategori;Nominal\n05/09/2026;Pengeluaran;Makanan;12.500\n");

        $this->import(new UploadedFile($path, 'data.csv', 'text/csv', null, true))
            ->assertOk()
            ->assertJsonPath('data.valid', 1)
            ->assertJsonPath('data.preview.0.amount', 12500);
    }

    public function test_categories_of_other_users_are_never_matched(): void
    {
        $other = User::factory()->create();
        Category::factory()->create(['user_id' => $other->id, 'name' => 'Rahasia']);

        $this->import($this->xlsx([self::HEADER, ['2026-09-01', 'Pengeluaran', 'Rahasia', null, null, null, 1000]]), ['dry_run' => 0])
            ->assertCreated()
            ->assertJsonPath('data.new_categories', 1);

        $this->assertSame(1, $this->user->categories()->where('name', 'Rahasia')->count());
        $this->assertSame(0, $other->transactions()->count());
    }

    public function test_file_validation(): void
    {
        $this->post('/api/import/transactions', [], ['Accept' => 'application/json'])
            ->assertStatus(422)->assertJsonValidationErrors('file');

        $txt = UploadedFile::fake()->createWithContent('data.txt', 'halo');
        $this->import($txt)->assertStatus(422)->assertJsonPath('errors.file.0', 'File harus berformat .xlsx, .xls, atau .csv.');

        $this->import($this->xlsx([['Tanggal', 'Keterangan'], ['2026-09-01', 'x']]))
            ->assertStatus(422)
            ->assertJsonPath('errors.file.0', 'Kolom wajib tidak ditemukan di baris pertama: Kategori, Nominal. Gunakan template impor.');

        $this->import($this->xlsx([self::HEADER]))
            ->assertStatus(422)->assertJsonPath('errors.file.0', 'File tidak berisi baris transaksi.');

        $broken = UploadedFile::fake()->createWithContent('rusak.xlsx', 'bukan zip');
        $this->import($broken)->assertStatus(422)->assertJsonPath('errors.file.0', 'File tidak bisa dibaca. Pastikan formatnya .xlsx, .xls, atau .csv.');
    }

    public function test_template_download(): void
    {
        $response = $this->get('/api/import/template')->assertOk();
        $this->assertStringContainsString('pidu-template-impor.xlsx', $response->headers->get('content-disposition'));

        $path = tempnam(sys_get_temp_dir(), 'tpl').'.xlsx';
        copy($response->baseResponse->getFile()->getPathname(), $path);
        $book = IOFactory::load($path);

        $this->assertSame(['Transaksi', 'Petunjuk'], $book->getSheetNames());
        $this->assertSame(self::HEADER, $book->getSheetByName('Transaksi')->rangeToArray('A1:G1')[0]);
        $this->assertStringContainsString('Makanan', $book->getSheetByName('Petunjuk')->getCell('C10')->getValue());
    }

    public function test_guest_gets_401(): void
    {
        $this->refreshApplication();
        $this->getJson('/api/import/template')->assertStatus(401);
        $this->postJson('/api/import/transactions')->assertStatus(401);
    }
}
