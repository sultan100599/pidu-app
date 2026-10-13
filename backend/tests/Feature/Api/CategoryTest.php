<?php

namespace Tests\Feature\Api;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_index_filters_and_counts(): void
    {
        $food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        Category::factory()->inactive()->create(['user_id' => $this->user->id, 'name' => 'Rokok']);
        Category::factory()->income()->create(['user_id' => $this->user->id, 'name' => 'Gaji']);
        Transaction::factory()->count(2)->create(['user_id' => $this->user->id, 'category_id' => $food->id]);

        $this->getJson('/api/categories')->assertOk()->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.type', 'expense');
        $this->getJson('/api/categories?type=income')->assertJsonCount(1, 'data');
        $this->getJson('/api/categories?type=expense&active=1')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.transactions_count', 2);
        $this->getJson('/api/categories?active=0')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Rokok');
    }

    public function test_create_and_unique_per_type(): void
    {
        $this->postJson('/api/categories', ['name' => 'Kopi', 'type' => 'expense', 'icon' => 'bi-cup'])
            ->assertCreated()->assertJsonPath('data.is_active', true);

        $this->postJson('/api/categories', ['name' => 'Kopi', 'type' => 'expense'])
            ->assertStatus(422)->assertJsonValidationErrors('name');

        // nama sama beda jenis → boleh
        $this->postJson('/api/categories', ['name' => 'Kopi', 'type' => 'income'])->assertCreated();

        // nama sama milik user lain → boleh
        Category::factory()->create(['name' => 'Teh', 'type' => 'expense']);
        $this->postJson('/api/categories', ['name' => 'Teh', 'type' => 'expense'])->assertCreated();
    }

    public function test_update_and_type_locked_when_used(): void
    {
        $cat = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Lama']);

        $this->putJson("/api/categories/{$cat->id}", ['name' => 'Lama', 'type' => 'expense', 'color' => '#000'])
            ->assertOk()->assertJsonPath('data.color', '#000');

        Transaction::factory()->create(['user_id' => $this->user->id, 'category_id' => $cat->id]);

        $this->putJson("/api/categories/{$cat->id}", ['name' => 'Baru', 'type' => 'income'])
            ->assertStatus(422)->assertJsonValidationErrors('type');
        $this->putJson("/api/categories/{$cat->id}", ['name' => 'Baru', 'type' => 'expense'])
            ->assertOk()->assertJsonPath('data.name', 'Baru');
    }

    public function test_toggle(): void
    {
        $cat = Category::factory()->create(['user_id' => $this->user->id]);

        $this->patchJson("/api/categories/{$cat->id}/toggle")->assertOk()->assertJsonPath('data.is_active', false);
        $this->patchJson("/api/categories/{$cat->id}/toggle")->assertOk()->assertJsonPath('data.is_active', true);
    }

    public function test_delete_used_category_is_rejected(): void
    {
        $cat = Category::factory()->create(['user_id' => $this->user->id]);
        Transaction::factory()->count(3)->create(['user_id' => $this->user->id, 'category_id' => $cat->id]);

        $this->deleteJson("/api/categories/{$cat->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kategori masih dipakai 3 transaksi, jadi tidak bisa dihapus. Sembunyikan saja supaya tidak muncul di form.');
        $this->assertDatabaseHas('categories', ['id' => $cat->id]);
    }

    public function test_delete_unused_category_cascades_budget(): void
    {
        $cat = Category::factory()->create(['user_id' => $this->user->id]);
        $budget = Budget::factory()->create(['user_id' => $this->user->id, 'category_id' => $cat->id]);

        $this->deleteJson("/api/categories/{$cat->id}")->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
        $this->assertDatabaseMissing('budgets', ['id' => $budget->id]);
    }
}
