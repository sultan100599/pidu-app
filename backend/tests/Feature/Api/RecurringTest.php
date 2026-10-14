<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RecurringTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $bills;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-14 10:00:00');
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        $this->bills = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Tagihan']);
    }

    private function create(array $data = []): array
    {
        return $this->postJson('/api/recurring', $data + [
            'type' => 'expense',
            'category_id' => $this->bills->id,
            'amount' => 150000,
            'description' => 'Listrik',
            'frequency' => 'monthly',
            'start_date' => '2026-10-20',
        ])->assertCreated()->json();
    }

    private function dates(): array
    {
        return $this->user->transactions()->orderBy('transaction_date')->pluck('transaction_date')
            ->map(fn ($d) => $d->toDateString())->all();
    }

    public function test_future_start_waits_then_scheduler_creates_on_the_day(): void
    {
        $json = $this->create();
        $this->assertSame(0, $json['created']);
        $this->assertSame('2026-10-20', $json['data']['next_date']);
        $this->assertSame([], $this->dates());

        $this->travelTo('2026-10-20 01:00:00');
        $this->artisan('pidu:recurring')->assertSuccessful();
        $this->artisan('pidu:recurring')->assertSuccessful(); // dijalankan dua kali tetap satu

        $this->assertSame(['2026-10-20'], $this->dates());
        $trx = $this->user->transactions()->firstOrFail();
        $this->assertSame('Listrik', $trx->description);
        $this->assertSame($json['data']['id'], $trx->recurring_transaction_id);
        $this->assertNotNull($trx->wallet_id);
        $this->getJson('/api/recurring')->assertJsonPath('data.0.next_date', '2026-11-20');
    }

    public function test_past_start_catches_up_and_month_end_does_not_drift(): void
    {
        $json = $this->create(['start_date' => '2026-07-31']);

        $this->assertSame(3, $json['created']);
        $this->assertSame('Transaksi rutin disimpan. 3 transaksi sudah dicatat.', $json['message']);
        $this->assertSame(['2026-07-31', '2026-08-31', '2026-09-30'], $this->dates());
        $this->assertSame('2026-10-31', $json['data']['next_date']);
    }

    public function test_weekly_and_pause_skips_missed_dates(): void
    {
        $id = $this->create(['frequency' => 'weekly', 'start_date' => '2026-10-14'])['data']['id'];
        $this->assertSame(['2026-10-14'], $this->dates());

        $this->patchJson("/api/recurring/$id/toggle")->assertOk()->assertJsonPath('data.is_active', false);
        $this->travelTo('2026-11-05 09:00:00');
        $this->artisan('pidu:recurring');
        $this->assertCount(1, $this->dates());

        // Jalan lagi: 21 Okt, 28 Okt, 4 Nov dilewati; berikutnya 11 Nov.
        $this->patchJson("/api/recurring/$id/toggle")
            ->assertOk()
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.next_date', '2026-11-11');
        $this->assertCount(1, $this->dates());
    }

    public function test_update_applies_to_next_dates_and_delete_keeps_history(): void
    {
        $id = $this->create(['start_date' => '2026-10-14'])['data']['id'];

        $this->putJson("/api/recurring/$id", [
            'type' => 'expense', 'category_id' => $this->bills->id, 'amount' => 175000, 'description' => 'Listrik naik',
            'frequency' => 'weekly', 'start_date' => '2020-01-01', // diabaikan
        ])->assertOk()
            ->assertJsonPath('data.amount', 175000)
            ->assertJsonPath('data.frequency', 'monthly')
            ->assertJsonPath('data.next_date', '2026-11-14');

        $this->deleteJson('/api/categories/'.$this->bills->id)->assertStatus(422);

        $this->deleteJson("/api/recurring/$id")->assertOk();
        $trx = $this->user->transactions()->firstOrFail();
        $this->assertEquals(150000, $trx->amount);
        $this->assertNull($trx->recurring_transaction_id);
    }

    public function test_validation_and_privacy(): void
    {
        $this->postJson('/api/recurring', ['type' => 'expense', 'frequency' => 'daily', 'start_date' => '2024-01-01'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id', 'amount', 'frequency', 'start_date']);

        $other = User::factory()->create();
        $foreignCategory = Category::factory()->create(['user_id' => $other->id]);
        $this->postJson('/api/recurring', [
            'type' => 'expense', 'category_id' => $foreignCategory->id, 'amount' => 1, 'frequency' => 'monthly', 'start_date' => '2026-10-14',
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');

        $foreign = $other->recurringTransactions()->create([
            'type' => 'expense', 'category_id' => $foreignCategory->id,
            'wallet_id' => $other->wallets()->create(['name' => 'X', 'kind' => 'cash', 'purpose' => 'personal'])->id,
            'amount' => 1, 'frequency' => 'monthly', 'start_date' => '2026-10-14', 'next_date' => '2026-10-14',
        ]);
        $this->patchJson("/api/recurring/{$foreign->id}/toggle")->assertNotFound();
        $this->deleteJson("/api/recurring/{$foreign->id}")->assertNotFound();
        $this->getJson('/api/recurring')->assertJsonCount(0, 'data');
    }

    public function test_notes_are_copied_to_each_created_transaction(): void
    {
        $json = $this->create(['start_date' => '2026-10-14', 'notes' => 'Token listrik rumah']);
        $this->assertSame('Token listrik rumah', $json['data']['notes']);
        $this->assertSame(['Token listrik rumah'], $this->user->transactions()->pluck('notes')->all());
    }
}
