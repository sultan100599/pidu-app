<?php

namespace Tests\Feature\Api;

use App\Exports\AllDataExport;
use App\Exports\TransactionsExport;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $food;

    private Category $salary;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-15 10:00:00');
        $this->user = User::factory()->create();
        $this->food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        $this->salary = Category::factory()->income()->create(['user_id' => $this->user->id, 'name' => 'Gaji']);
        Sanctum::actingAs($this->user);
    }

    private function trx(string $date, float $amount, string $type = 'expense', string $description = 'Makan'): void
    {
        Transaction::factory()->create([
            'user_id' => $this->user->id, 'type' => $type,
            'category_id' => $type === 'income' ? $this->salary->id : $this->food->id,
            'transaction_date' => $date, 'amount' => $amount, 'description' => $description,
        ]);
    }

    /**
     * Unduh xlsx sungguhan lalu buka dengan PhpSpreadsheet.
     */
    private function downloadSpreadsheet(string $url): \PhpOffice\PhpSpreadsheet\Spreadsheet
    {
        $response = $this->get($url, ['Accept' => 'application/json'])->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
        $path = tempnam(sys_get_temp_dir(), 'xlsx');
        copy($response->baseResponse->getFile()->getPathname(), $path);

        return IOFactory::load($path);
    }

    public function test_excel_follows_filters_and_contains_totals(): void
    {
        $this->trx('2026-09-01', 10_000);
        $this->trx('2026-09-02', 20_000, description: 'Kopi');
        $this->trx('2026-09-03', 1_000_000, 'income', 'Gaji');
        $this->trx('2026-10-01', 99_000); // di luar periode
        Transaction::factory()->create(['transaction_date' => '2026-09-01', 'amount' => 777]); // user lain

        $book = $this->downloadSpreadsheet('/api/export/excel?start_date=2026-09-01&end_date=2026-09-30&type=expense&sort=amount&dir=asc');
        $sheet = $book->getSheetByName('Transaksi');

        $this->assertSame(['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Catatan', 'Metode', 'Nominal'], $sheet->rangeToArray('A1:G1')[0]);
        // 2 pengeluaran September, urut nominal naik; pengeluaran bernilai negatif
        $this->assertSame('Makan', $sheet->getCell('D2')->getValue());
        $this->assertEquals(-10000, $sheet->getCell('G2')->getValue());
        $this->assertEquals(-20000, $sheet->getCell('G3')->getValue());
        $this->assertSame('dd/mm/yyyy', $sheet->getStyle('A2')->getNumberFormat()->getFormatCode());
        // baris kosong, lalu total
        $this->assertNull($sheet->getCell('A4')->getValue());
        $this->assertSame('Total pengeluaran', $sheet->getCell('A6')->getValue());
        $this->assertEquals(-30000, $sheet->getCell('G6')->getValue());
        $this->assertEquals(-30000, $sheet->getCell('G7')->getValue()); // saldo
        $this->assertSame(7, $sheet->getHighestRow());
    }

    public function test_excel_download_filename(): void
    {
        Excel::fake();

        $this->get('/api/export/excel')->assertOk();

        Excel::assertDownloaded('pidu-transaksi-20260915-100000.xlsx', fn (TransactionsExport $e) => count($e->sheets()) === 1);
    }

    public function test_formula_like_text_is_stored_as_plain_text(): void
    {
        $this->trx('2026-09-01', 5_000, description: '=HYPERLINK("http://evil","klik")');

        $sheet = $this->downloadSpreadsheet('/api/export/excel')->getSheetByName('Transaksi');

        $cell = $sheet->getCell('D2');
        $this->assertSame('s', $cell->getDataType());
        $this->assertSame('=HYPERLINK("http://evil","klik")', $cell->getValue());
    }

    public function test_pdf_is_generated_with_filters(): void
    {
        $this->trx('2026-09-01', 10_000);

        $response = $this->get('/api/export/pdf?year=2026&month=9&search=makan', ['Accept' => 'application/json'])
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertStringContainsString('pidu-transaksi-', $response->headers->get('content-disposition'));
    }

    public function test_pdf_rejects_too_many_rows(): void
    {
        $rows = [];
        for ($i = 0; $i <= ExportService::PDF_MAX_ROWS; $i++) {
            $rows[] = [
                'user_id' => $this->user->id, 'category_id' => $this->food->id, 'transaction_date' => '2026-09-01',
                'type' => 'expense', 'amount' => 1000, 'payment_method' => 'cash', 'created_at' => now(), 'updated_at' => now(),
            ];
        }
        foreach (array_chunk($rows, 500) as $chunk) {
            Transaction::insert($chunk);
        }

        $this->getJson('/api/export/pdf')
            ->assertStatus(422)
            ->assertJsonPath('message', 'PDF dibatasi 2.000 transaksi (hasil filter: 2.001). Persempit filter atau gunakan export Excel.');
    }

    public function test_export_all_has_seven_sheets_with_report_numbers(): void
    {
        $this->trx('2026-01-10', 100_000);
        $this->trx('2026-09-01', 50_000);
        $this->trx('2026-09-25', 5_000_000, 'income', 'Gaji');
        $this->trx('2025-05-05', 7_000); // tahun lain: hanya di sheet Tahunan
        Budget::factory()->create(['user_id' => $this->user->id, 'category_id' => $this->food->id, 'month' => 9, 'year' => 2026, 'amount' => 40_000]);

        $book = $this->downloadSpreadsheet('/api/export/all?year=2026');

        $this->assertSame(
            ['Transaksi', 'Harian', 'Mingguan', 'Bulanan', 'Tahunan', 'Kategori', 'Budget'],
            $book->getSheetNames(),
        );

        $harian = $book->getSheetByName('Harian');
        $this->assertSame(1 + 365 + 1, $harian->getHighestRow());
        $this->assertEquals(['Total', 5000000, 150000, 4850000, 3], $harian->rangeToArray('A367:E367', null, false, false)[0]);

        $bulanan = $book->getSheetByName('Bulanan');
        $this->assertEquals(['September 2026', 5000000, 50000, 4950000, 2], $bulanan->rangeToArray('A10:E10', null, false, false)[0]);

        $tahunan = $book->getSheetByName('Tahunan');
        $this->assertEquals([2025, 0, 7000, -7000, 1], $tahunan->rangeToArray('A2:E2', null, false, false)[0]);

        $mingguan = $book->getSheetByName('Mingguan');
        $lastWeekly = $mingguan->getHighestRow();
        $this->assertEquals(150000, $mingguan->getCell("E{$lastWeekly}")->getValue()); // total = harian

        $budget = $book->getSheetByName('Budget')->rangeToArray('A2:G2', null, false, false)[0];
        $this->assertEquals(['September 2026', 'Makanan', 40000, 50000, -10000, 125, 'Terlampaui'], $budget);

        $kategori = $book->getSheetByName('Kategori')->rangeToArray('A2:E3', null, false, false);
        $this->assertEquals(['Gaji', 'Pemasukan', 5000000, 1, 100], $kategori[0]);
        $this->assertEquals(['Makanan', 'Pengeluaran', 150000, 2, 100], $kategori[1]);
    }

    public function test_export_all_filename_and_default_year(): void
    {
        Excel::fake();

        $this->get('/api/export/all')->assertOk();

        Excel::assertDownloaded('pidu-semua-2026-20260915-100000.xlsx', fn (AllDataExport $e) => count($e->sheets()) === 7);
    }

    public function test_requires_auth_and_valid_filters(): void
    {
        $this->getJson('/api/export/excel?type=hacker&start_date=2026-09-10&end_date=2026-09-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'end_date']);
        $this->getJson('/api/export/all?year=1990')->assertStatus(422)->assertJsonValidationErrors('year');
    }

    public function test_guest_gets_401(): void
    {
        $this->refreshApplication();
        foreach (['excel', 'pdf', 'all'] as $endpoint) {
            $this->getJson("/api/export/{$endpoint}")->assertStatus(401);
        }
    }
}
