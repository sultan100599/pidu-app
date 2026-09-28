<?php

namespace Tests\Feature\Api;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $a;

    private User $b;

    protected function setUp(): void
    {
        parent::setUp();
        $this->a = User::factory()->create();
        $this->b = User::factory()->create();
        Sanctum::actingAs($this->a);
    }

    public function test_cannot_access_other_users_transaction(): void
    {
        $trx = Transaction::factory()->create(['user_id' => $this->b->id]);
        $ownCategory = Category::factory()->create(['user_id' => $this->a->id]);

        $this->getJson("/api/transactions/{$trx->id}")
            ->assertNotFound()
            ->assertExactJson(['message' => 'Data tidak ditemukan.']);

        $this->putJson("/api/transactions/{$trx->id}", [
            'transaction_date' => '2026-09-01', 'type' => 'expense',
            'category_id' => $ownCategory->id, 'amount' => 1000,
        ])->assertNotFound();

        $this->deleteJson("/api/transactions/{$trx->id}")->assertNotFound();
        $this->assertDatabaseHas('transactions', ['id' => $trx->id]);
    }

    public function test_cannot_use_other_users_category(): void
    {
        $foreign = Category::factory()->create(['user_id' => $this->b->id]);

        $this->postJson('/api/transactions', [
            'transaction_date' => '2026-09-01', 'type' => 'expense',
            'category_id' => $foreign->id, 'amount' => 1000,
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');

        $this->postJson('/api/budgets', [
            'category_id' => $foreign->id, 'month' => 9, 'year' => 2026, 'amount' => 1000,
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');

        $this->getJson("/api/transactions?category_id={$foreign->id}")->assertStatus(422);
    }

    public function test_index_only_lists_own_transactions(): void
    {
        Transaction::factory()->count(2)->create(['user_id' => $this->a->id]);
        Transaction::factory()->count(3)->create(['user_id' => $this->b->id]);

        $this->getJson('/api/transactions')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.count', 2);
    }

    public function test_cannot_modify_other_users_category(): void
    {
        $foreign = Category::factory()->create(['user_id' => $this->b->id]);

        $this->putJson("/api/categories/{$foreign->id}", ['name' => 'X', 'type' => 'expense'])->assertNotFound();
        $this->patchJson("/api/categories/{$foreign->id}/toggle")->assertNotFound();
        $this->deleteJson("/api/categories/{$foreign->id}")->assertNotFound();

        $this->getJson('/api/categories')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_cannot_modify_other_users_budget(): void
    {
        $budget = Budget::factory()->create(['user_id' => $this->b->id]);

        $this->putJson("/api/budgets/{$budget->id}", ['amount' => 5])->assertNotFound();
        $this->deleteJson("/api/budgets/{$budget->id}")->assertNotFound();

        $this->getJson("/api/budgets?month={$budget->month}&year={$budget->year}")
            ->assertOk()->assertJsonCount(0, 'data');
    }
}
