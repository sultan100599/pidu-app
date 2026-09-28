<?php

namespace Tests\Feature\Api;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-09-15 10:00:00');
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function trx(string $type, string $date, float $amount, Category $category): void
    {
        Transaction::factory()->create([
            'user_id' => $this->user->id, 'type' => $type, 'category_id' => $category->id,
            'transaction_date' => $date, 'amount' => $amount,
        ]);
    }

    private function fixture(): array
    {
        $salary = Category::factory()->income()->create(['user_id' => $this->user->id, 'name' => 'Gaji']);
        $food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        $transport = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Transportasi']);

        $this->trx('income', '2026-09-01', 1_000_000, $salary);
        $this->trx('expense', '2026-09-02', 250_000, $food);
        $this->trx('expense', '2026-09-03', 150_000, $transport);
        // di luar periode — tidak boleh terhitung
        $this->trx('expense', '2026-09-04', 999_000, $food);
        // milik user lain — tidak boleh terhitung
        Transaction::factory()->create(['transaction_date' => '2026-09-02', 'amount' => 777_000]);

        return compact('salary', 'food', 'transport');
    }

    public function test_dashboard_numbers_match_manual_calculation(): void
    {
        ['food' => $food] = $this->fixture();

        $res = $this->getJson('/api/dashboard?start_date=2026-09-01&end_date=2026-09-03')->assertOk();

        $res->assertJsonPath('period', ['start_date' => '2026-09-01', 'end_date' => '2026-09-03', 'days' => 3])
            ->assertJsonPath('summary', [
                'income' => 1000000,
                'expense' => 400000,
                'balance' => 600000,
                'avg_daily_expense' => 133333.33,
                'expense_ratio' => 40,
                'transaction_count' => 3,
            ])
            ->assertJsonPath('chart.granularity', 'day')
            ->assertJsonPath('chart.labels', ['2026-09-01', '2026-09-02', '2026-09-03'])
            ->assertJsonPath('chart.income', [1000000, 0, 0])
            ->assertJsonPath('chart.expense', [0, 250000, 150000])
            ->assertJsonCount(2, 'category_breakdown')
            ->assertJsonPath('category_breakdown.0.category_id', $food->id)
            ->assertJsonPath('category_breakdown.0.percentage', 62.5)
            ->assertJsonPath('category_breakdown.1.percentage', 37.5)
            ->assertJsonCount(2, 'top_categories')
            ->assertJsonCount(2, 'largest_transactions')
            ->assertJsonPath('largest_transactions.0.amount', 250000);
    }

    public function test_default_period_is_current_month(): void
    {
        $this->fixture();

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('period', ['start_date' => '2026-09-01', 'end_date' => '2026-09-30', 'days' => 30])
            ->assertJsonCount(30, 'chart.labels')
            ->assertJsonPath('summary.expense', 1399000);
    }

    public function test_long_period_uses_monthly_granularity(): void
    {
        $this->fixture();

        $this->getJson('/api/dashboard?year=2026')
            ->assertOk()
            ->assertJsonPath('period.days', 365)
            ->assertJsonPath('chart.granularity', 'month')
            ->assertJsonCount(12, 'chart.labels')
            ->assertJsonPath('chart.labels.8', '2026-09')
            ->assertJsonPath('chart.expense.8', 1399000);
    }

    public function test_empty_user_has_zeros_and_null_ratio(): void
    {
        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('summary', [
                'income' => 0, 'expense' => 0, 'balance' => 0,
                'avg_daily_expense' => 0, 'expense_ratio' => null, 'transaction_count' => 0,
            ])
            ->assertJsonPath('category_breakdown', [])
            ->assertJsonPath('largest_transactions', [])
            ->assertJsonPath('budgets', []);
    }

    public function test_without_income_ratio_is_null(): void
    {
        $food = Category::factory()->create(['user_id' => $this->user->id]);
        $this->trx('expense', '2026-09-10', 100_000, $food);

        $this->getJson('/api/dashboard')
            ->assertJsonPath('summary.expense_ratio', null)
            ->assertJsonPath('summary.balance', -100000)
            ->assertJsonPath('category_breakdown.0.percentage', 100);
    }

    public function test_single_day_period(): void
    {
        $this->fixture();

        $this->getJson('/api/dashboard?start_date=2026-09-02&end_date=2026-09-02')
            ->assertOk()
            ->assertJsonPath('period.days', 1)
            ->assertJsonPath('summary.avg_daily_expense', 250000)
            ->assertJsonPath('chart.labels', ['2026-09-02']);
    }

    public function test_income_filter_yields_empty_breakdown(): void
    {
        $this->fixture();

        $this->getJson('/api/dashboard?type=income')
            ->assertOk()
            ->assertJsonPath('summary.expense', 0)
            ->assertJsonPath('summary.income', 1000000)
            ->assertJsonPath('category_breakdown', []);
    }

    public function test_includes_budgets_for_end_date_month(): void
    {
        ['food' => $food] = $this->fixture();
        Budget::factory()->create(['user_id' => $this->user->id, 'category_id' => $food->id, 'month' => 9, 'year' => 2026, 'amount' => 2_000_000]);

        $this->getJson('/api/dashboard')
            ->assertJsonCount(1, 'budgets')
            ->assertJsonPath('budgets.0.used', 1249000)
            ->assertJsonPath('budgets.0.status', 'ok');
    }
}
