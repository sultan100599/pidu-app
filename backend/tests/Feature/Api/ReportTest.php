<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportTest extends TestCase
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
        $this->food = Category::factory()->create(['user_id' => $this->user->id]);
        $this->salary = Category::factory()->income()->create(['user_id' => $this->user->id]);
        Sanctum::actingAs($this->user);
    }

    private function trx(string $date, float $amount, string $type = 'expense'): void
    {
        Transaction::factory()->create([
            'user_id' => $this->user->id, 'type' => $type,
            'category_id' => $type === 'income' ? $this->salary->id : $this->food->id,
            'transaction_date' => $date, 'amount' => $amount,
        ]);
    }

    private function seedSeptember(): void
    {
        $this->trx('2026-09-01', 10_000);           // Selasa, minggu 1
        $this->trx('2026-09-06', 20_000);           // Minggu, akhir minggu 1
        $this->trx('2026-09-07', 30_000);           // Senin, minggu 2
        $this->trx('2026-09-25', 5_000_000, 'income');
        $this->trx('2026-09-30', 40_000);           // Rabu, minggu terakhir (dipotong)
        $this->trx('2026-10-01', 99_000);           // di luar September
    }

    public function test_daily_has_every_day_and_totals(): void
    {
        $this->seedSeptember();

        $res = $this->getJson('/api/reports/daily?year=2026&month=9')->assertOk();

        $res->assertJsonCount(30, 'rows')
            ->assertJsonPath('rows.0', ['date' => '2026-09-01', 'income' => 0, 'expense' => 10000, 'balance' => -10000, 'count' => 1])
            ->assertJsonPath('rows.1.count', 0)
            ->assertJsonPath('totals', ['income' => 5000000, 'expense' => 100000, 'balance' => 4900000, 'count' => 5]);

        $this->assertEqualsWithDelta(100000, array_sum(array_column($res->json('rows'), 'expense')), 0.001);
    }

    public function test_weekly_iso_weeks_are_clipped_to_period(): void
    {
        $this->seedSeptember();

        $daily = $this->getJson('/api/reports/daily?start_date=2026-09-01&end_date=2026-09-30')->json();
        $weekly = $this->getJson('/api/reports/weekly?start_date=2026-09-01&end_date=2026-09-30')->assertOk();

        // 1 Sep 2026 = Selasa → minggu 1 = 1–6 Sep; 28 Sep Senin → minggu 5 = 28–30 Sep
        $weekly->assertJsonCount(5, 'rows')
            ->assertJsonPath('rows.0.start_date', '2026-09-01')
            ->assertJsonPath('rows.0.end_date', '2026-09-06')
            ->assertJsonPath('rows.0.label', 'Minggu 1')
            ->assertJsonPath('rows.0.expense', 30000)
            ->assertJsonPath('rows.1.start_date', '2026-09-07')
            ->assertJsonPath('rows.1.end_date', '2026-09-13')
            ->assertJsonPath('rows.4.start_date', '2026-09-28')
            ->assertJsonPath('rows.4.end_date', '2026-09-30')
            ->assertJsonPath('rows.4.expense', 40000);

        $this->assertSame($daily['totals'], $weekly->json('totals'));
        $this->assertEqualsWithDelta(
            array_sum(array_column($daily['rows'], 'expense')),
            array_sum(array_column($weekly->json('rows'), 'expense')),
            0.001
        );
    }

    public function test_monthly_has_12_rows(): void
    {
        $this->seedSeptember();

        $this->getJson('/api/reports/monthly?year=2026')
            ->assertOk()
            ->assertJsonCount(12, 'rows')
            ->assertJsonPath('rows.0', ['month' => 1, 'label' => 'Januari', 'income' => 0, 'expense' => 0, 'balance' => 0, 'count' => 0])
            ->assertJsonPath('rows.8.label', 'September')
            ->assertJsonPath('rows.8.expense', 100000)
            ->assertJsonPath('rows.9.expense', 99000)
            ->assertJsonPath('totals.expense', 199000);

        // default = tahun berjalan
        $this->getJson('/api/reports/monthly')->assertJsonPath('year', 2026);
    }

    public function test_yearly_fills_empty_years(): void
    {
        $this->trx('2023-05-01', 1_000);
        $this->trx('2026-09-01', 2_000);

        $this->getJson('/api/reports/yearly')
            ->assertOk()
            ->assertJsonCount(4, 'rows')
            ->assertJsonPath('rows.0.year', 2023)
            ->assertJsonPath('rows.1', ['year' => 2024, 'income' => 0, 'expense' => 0, 'balance' => 0, 'count' => 0])
            ->assertJsonPath('rows.3.expense', 2000)
            ->assertJsonPath('totals.expense', 3000);
    }

    public function test_yearly_without_transactions_returns_current_year(): void
    {
        $this->getJson('/api/reports/yearly')
            ->assertOk()
            ->assertJsonPath('rows', [['year' => 2026, 'income' => 0, 'expense' => 0, 'balance' => 0, 'count' => 0]]);
    }

    public function test_calendar_and_day_detail(): void
    {
        $this->seedSeptember();

        $this->getJson('/api/reports/calendar?year=2026&month=9')
            ->assertOk()
            ->assertJsonCount(30, 'days')
            ->assertJsonPath('days.24', ['date' => '2026-09-25', 'income' => 5000000, 'expense' => 0, 'count' => 1]);

        $this->getJson('/api/reports/calendar')->assertJsonPath('month', 9)->assertJsonPath('year', 2026);

        $this->getJson('/api/reports/day/2026-09-01')
            ->assertOk()
            ->assertJsonCount(1, 'transactions')
            ->assertJsonPath('totals.expense', 10000);

        $this->getJson('/api/reports/day/01-09-2026')->assertStatus(422);
    }
}
