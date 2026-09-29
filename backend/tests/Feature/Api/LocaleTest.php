<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ExportService;
use App\Support\Locale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public static function locales(): array
    {
        return [
            'English' => ['en', 'The amount field is required.', 'The date field is required.', 'Transaction saved.', 'Incorrect email or password.', 'Expense', 'Credit card', 'February', 'Week 1', 'Data not found.', 'Endpoint not found.'],
            'Sunda' => ['su', 'Nominal kedah dieusian.', 'Ping kaping kedah dieusian.', 'Transaksi parantos disimpen.', 'Email atanapi kecap akses lepat.', 'Pangeluaran', 'Kartu kiridit', 'Pébruari', 'Minggu ka-1', 'Data teu kapendak.', 'Endpoint teu kapendak.'],
        ];
    }

    private function account(): array
    {
        $user = User::factory()->create();
        $category = Category::factory()->create(['user_id' => $user->id, 'name' => 'Makanan']);
        Sanctum::actingAs($user);

        return [$user, $category];
    }

    #[DataProvider('locales')]
    public function test_api_messages_labels_validation_and_reports(
        string $locale, string $amount, string $date, string $saved, string $login,
        string $type, string $method, string $month, string $week, string $missing, string $endpoint,
    ): void {
        [$user, $category] = $this->account();
        $this->withHeader('Accept-Language', $locale);
        $this->postJson('/api/transactions', [])
            ->assertUnprocessable()
            ->assertJsonPath('errors.amount.0', $amount)
            ->assertJsonPath('errors.transaction_date.0', $date);
        $response = $this->postJson('/api/transactions', [
            'transaction_date' => '2026-02-01', 'type' => 'expense', 'category_id' => $category->id,
            'amount' => 15000, 'payment_method' => 'credit_card', 'description' => 'Makan siang',
        ])->assertCreated()
            ->assertJsonPath('message', $saved)
            ->assertJsonPath('data.type_label', $type)
            ->assertJsonPath('data.payment_method_label', $method)
            ->assertJsonPath('data.category.name', 'Makanan')
            ->assertJsonPath('data.description', 'Makan siang');
        $this->getJson('/api/transactions/'.$response->json('data.id'))->assertOk()->assertJsonPath('data.type_label', $type);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonPath('message', $login)->assertJsonPath('errors.email.0', $login);
        $this->getJson('/api/reports/monthly?year=2026')->assertOk()->assertJsonPath('rows.1.label', $month);
        $this->getJson('/api/reports/weekly?year=2026&month=2')->assertOk()->assertJsonPath('rows.0.label', $week);
        $this->getJson('/api/reports/calendar?year=2026&month=2')->assertOk()->assertJsonPath('label', "$month 2026");
        $this->getJson('/api/transactions/999999')->assertNotFound()->assertJsonPath('message', $missing);
        $this->getJson('/api/nonexistent')->assertNotFound()->assertJsonPath('message', $endpoint);
    }

    public static function fallbackHeaders(): array
    {
        return [[''], ['fr'], ['en-US'], ['en, su;q=0.9']];
    }

    #[DataProvider('fallbackHeaders')]
    public function test_unknown_or_empty_locale_resets_to_indonesian(string $header): void
    {
        $this->withHeader('Accept-Language', 'en')->getJson('/api/missing')->assertJsonPath('message', 'Endpoint not found.');
        $this->withHeader('Accept-Language', $header)->getJson('/api/missing')->assertJsonPath('message', 'Endpoint tidak ditemukan.');
        $this->withoutHeader('Accept-Language')->postJson('/api/auth/login')->assertJsonPath('errors.email.0', 'Email wajib diisi.');
    }

    public static function languages(): array
    {
        return [['en'], ['su']];
    }

    #[DataProvider('languages')]
    public function test_custom_validation_import_errors_and_summary(string $locale): void
    {
        [, $category] = $this->account();
        $this->withHeader('Accept-Language', $locale);
        $this->postJson('/api/import/transactions', [])
            ->assertUnprocessable()->assertJsonPath('errors.file.0', $locale === 'en' ? 'The file field is required.' : 'Berkas kedah dieusian.');
        $this->postJson('/api/budgets', ['category_id' => $category->id, 'month' => 2, 'year' => 2026, 'amount' => 0])
            ->assertUnprocessable()->assertJsonPath('errors.amount.0', $locale === 'en' ? 'The amount must be greater than 0.' : 'Nominal kedah langkung ti 0.');
        $this->postJson('/api/budgets', ['category_id' => $category->id, 'month' => 2, 'year' => 2026, 'amount' => 1000])->assertCreated();
        $this->postJson('/api/budgets', ['category_id' => $category->id, 'month' => 2, 'year' => 2026, 'amount' => 1000])
            ->assertUnprocessable()->assertJsonPath('errors.category_id.0', __('validation.custom_messages.budget_duplicate'));
        $invalid = UploadedFile::fake()->createWithContent('invalid.csv', "Tanggal,Jenis,Kategori,Nominal\ninvalid,Pengeluaran,Makanan,0\n");
        $result = $this->post('/api/import/transactions', ['file' => $invalid, 'dry_run' => true], ['Accept' => 'application/json'])->assertOk();
        $result->assertJsonPath('data.errors.0.messages.0', __('messages.import_date'));
        $result->assertJsonPath('data.errors.0.messages.1', __('validation.custom_messages.amount_positive'));
        $valid = UploadedFile::fake()->createWithContent('valid.csv', "Tanggal,Jenis,Kategori,Nominal,Metode\n2026-02-01,Pengeluaran,Makanan,15000,Kartu Kredit\n");
        $this->post('/api/import/transactions', ['file' => $valid, 'dry_run' => false], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('message', __('messages.imported', ['count' => 1]));
        $this->getJson('/api/categories?active=invalid')->assertUnprocessable()->assertJsonPath('errors.active.0', __('validation.boolean', ['attribute' => __('validation.attributes.active')]));
    }

    #[DataProvider('languages')]
    public function test_unauthenticated_throttle_and_production_error_are_localized(string $locale): void
    {
        config(['app.debug' => false]);
        Route::get('/api/_locale/error', fn () => throw new \RuntimeException('private detail'));
        Route::get('/api/_locale/throttle', fn () => abort(429))->middleware('api');
        $this->withHeader('Accept-Language', $locale)->getJson('/api/auth/me')
            ->assertUnauthorized()->assertJsonPath('message', $locale === 'en' ? 'Please sign in first.' : 'Mangga lebet heula.');
        $this->getJson('/api/_locale/throttle')->assertStatus(429)->assertJsonPath('message', __('messages.throttled'));
        $this->getJson('/api/_locale/error')->assertStatus(500)->assertExactJson(['message' => __('messages.server_error')]);
    }

    #[DataProvider('languages')]
    public function test_excel_and_pdf_content_stay_indonesian(string $locale): void
    {
        [$user, $category] = $this->account();
        Transaction::factory()->create([
            'user_id' => $user->id, 'category_id' => $category->id, 'type' => 'expense',
            'transaction_date' => '2026-02-01', 'payment_method' => 'credit_card', 'description' => 'Catatan pribadi',
        ]);
        $this->withHeader('Accept-Language', $locale);
        foreach (['/api/export/excel', '/api/export/all?year=2026'] as $url) {
            $response = $this->get($url, ['Accept' => 'application/json'])->assertOk();
            $book = IOFactory::load($response->baseResponse->getFile()->getPathname());
            $sheet = $book->getSheetByName('Transaksi');
            $this->assertSame('Tanggal', $sheet->getCell('A1')->getValue());
            $this->assertSame('Pengeluaran', $sheet->getCell('B2')->getValue());
            $this->assertSame('Kartu Kredit', $sheet->getCell('F2')->getValue());
            $this->assertSame('Catatan pribadi', $sheet->getCell('D2')->getValue());
            if ($book->getSheetCount() === 7) {
                $this->assertSame('Februari 2026', $book->getSheetByName('Bulanan')->getCell('A3')->getValue());
                $this->assertSame('Minggu 1', $book->getSheetByName('Mingguan')->getCell('A2')->getValue());
            }
            $book->disconnectWorksheets();
        }
        $data = app(ExportService::class)->transactionsPdfData($user, null, [], 'transaction_date', 'asc', []);
        $html = view('exports.transactions-pdf', $data)->render();
        $this->assertStringContainsString('Kartu Kredit', $html);
        $this->assertStringContainsString('Pengeluaran', $html);
        $this->get('/api/export/pdf')->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertSame($locale, app()->getLocale());
    }

    public function test_catalogs_have_matching_keys_and_locale_scope_restores_after_failure(): void
    {
        $flatten = function (array $data, string $prefix = '') use (&$flatten): array {
            $out = [];
            foreach ($data as $key => $value) {
                if (is_array($value)) $out += $flatten($value, "$prefix$key.");
                else $out["$prefix$key"] = $value;
            }
            return $out;
        };
        foreach (['messages', 'validation', 'pagination'] as $file) {
            $id = $flatten(require lang_path("id/$file.php"));
            foreach (['en', 'su'] as $locale) {
                $translated = $flatten(require lang_path("$locale/$file.php"));
                $this->assertSame(array_keys($id), array_keys($translated));
                foreach ($translated as $value) $this->assertNotSame('', $value);
            }
        }
        app()->setLocale('su');
        try {
            Locale::in('id', fn () => throw new \RuntimeException);
        } catch (\RuntimeException) {
            $this->assertSame('su', app()->getLocale());
        }
    }
}
