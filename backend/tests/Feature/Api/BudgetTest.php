<?php

namespace Tests\Feature\Api;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BudgetTest extends TestCase
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

    /**
     * Buat budget 10.000 dengan pemakaian $used pada September 2026.
     */
    private function budgetWithUsage(float $used): Category
    {
        $category = Category::factory()->create(['user_id' => $this->user->id]);
        Budget::factory()->create([
            'user_id' => $this->user->id, 'category_id' => $category->id,
            'month' => 9, 'year' => 2026, 'amount' => 10_000,
        ]);
        Transaction::factory()->create([
            'user_id' => $this->user->id, 'category_id' => $category->id,
            'transaction_date' => '2026-09-10', 'amount' => $used,
        ]);

        return $category;
    }

    public function test_status_thresholds(): void
    {
        $cases = [7_999 => 'ok', 8_000 => 'warning', 9_999 => 'warning', 10_000 => 'exceeded', 12_500 => 'exceeded'];
        foreach (array_keys($cases) as $used) {
            $this->budgetWithUsage($used);
        }
        // transaksi bulan lain tidak dihitung
        Transaction::factory()->create(['user_id' => $this->user->id, 'transaction_date' => '2026-08-31', 'amount' => 1]);

        $rows = collect($this->getJson('/api/budgets?month=9&year=2026')->assertOk()->json('data'))
            ->keyBy(fn ($r) => (string) $r['used']);

        $this->assertSame(79.99, $rows['7999']['percentage']);
        foreach ($cases as $used => $status) {
            $this->assertSame($status, $rows[(string) $used]['status'], "used=$used");
        }
        $this->assertEquals(-2500, $rows['12500']['remaining']);
    }

    public function test_index_totals_and_default_month(): void
    {
        $this->budgetWithUsage(4_000);
        $this->budgetWithUsage(6_000);

        $this->getJson('/api/budgets')
            ->assertOk()
            ->assertJsonPath('month', 9)
            ->assertJsonPath('year', 2026)
            ->assertJsonPath('totals', ['amount' => 20000, 'used' => 10000, 'remaining' => 10000]);
    }

    public function test_create_update_delete_and_duplicate(): void
    {
        $category = Category::factory()->create(['user_id' => $this->user->id]);
        $payload = ['category_id' => $category->id, 'month' => 9, 'year' => 2026, 'amount' => 500_000];

        $id = $this->postJson('/api/budgets', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'ok')
            ->json('data.id');

        $this->postJson('/api/budgets', $payload)
            ->assertStatus(422)
            ->assertJsonPath('errors.category_id.0', 'Budget kategori ini untuk bulan tersebut sudah ada.');

        $this->putJson("/api/budgets/$id", ['amount' => 750_000])
            ->assertOk()->assertJsonPath('data.amount', 750000);

        // pindah ke bulan yang sudah punya budget kategori sama → 422
        Budget::factory()->create(['user_id' => $this->user->id, 'category_id' => $category->id, 'month' => 10, 'year' => 2026]);
        $this->putJson("/api/budgets/$id", ['amount' => 1, 'month' => 10])->assertStatus(422);

        $this->deleteJson("/api/budgets/$id")->assertOk();
        $this->assertDatabaseMissing('budgets', ['id' => $id]);
    }

    public function test_budget_requires_expense_category_and_positive_amount(): void
    {
        $income = Category::factory()->income()->create(['user_id' => $this->user->id]);

        $this->postJson('/api/budgets', ['category_id' => $income->id, 'month' => 13, 'year' => 2026, 'amount' => 0])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id', 'month', 'amount']);
    }
}
