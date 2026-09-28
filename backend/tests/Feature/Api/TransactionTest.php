<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $food;

    private Category $salary;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        $this->salary = Category::factory()->income()->create(['user_id' => $this->user->id, 'name' => 'Gaji']);
        Sanctum::actingAs($this->user);
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'transaction_date' => '2026-09-10',
            'type' => 'expense',
            'category_id' => $this->food->id,
            'amount' => 25000,
            'description' => 'Makan siang',
        ], $override);
    }

    public function test_create_transaction(): void
    {
        $this->postJson('/api/transactions', $this->payload())
            ->assertCreated()
            ->assertJsonPath('message', 'Transaksi berhasil ditambahkan.')
            ->assertJsonPath('data.amount', 25000)
            ->assertJsonPath('data.payment_method', 'cash')
            ->assertJsonPath('data.type_label', 'Pengeluaran')
            ->assertJsonPath('data.category.name', 'Makanan')
            ->assertJsonPath('data.transaction_date', '2026-09-10');

        // Disimpan sebagai Y-m-d murni (tanpa jam) agar filter tanggal konsisten.
        $this->assertDatabaseHas('transactions', ['transaction_date' => '2026-09-10', 'amount' => 25000]);
    }

    public function test_show_update_delete(): void
    {
        $id = $this->postJson('/api/transactions', $this->payload())->json('data.id');

        $this->getJson("/api/transactions/$id")->assertOk()->assertJsonPath('data.id', $id);

        $this->putJson("/api/transactions/$id", $this->payload(['amount' => 30000.5, 'payment_method' => 'qris']))
            ->assertOk()
            ->assertJsonPath('message', 'Transaksi berhasil diperbarui.')
            ->assertJsonPath('data.amount', 30000.5)
            ->assertJsonPath('data.payment_method_label', 'QRIS');

        $this->deleteJson("/api/transactions/$id")
            ->assertOk()->assertJsonPath('message', 'Transaksi berhasil dihapus.');
        $this->assertDatabaseMissing('transactions', ['id' => $id]);
    }

    public function test_amount_validation(): void
    {
        foreach ([0, -5000, '', null, 'abc'] as $amount) {
            $this->postJson('/api/transactions', $this->payload(['amount' => $amount]))
                ->assertStatus(422)
                ->assertJsonValidationErrors('amount');
        }

        $this->postJson('/api/transactions', $this->payload(['amount' => 0]))
            ->assertJsonPath('errors.amount.0', 'Nominal harus lebih dari 0.');
    }

    public function test_size_rule_messages_are_indonesian(): void
    {
        $this->postJson('/api/transactions', $this->payload(['description' => str_repeat('a', 256), 'amount' => 1_000_000_000_000]))
            ->assertStatus(422)
            ->assertJsonPath('errors.description.0', 'Deskripsi maksimal 255 karakter.')
            ->assertJsonPath('errors.amount.0', 'Nominal maksimal 999999999999.');

        $this->getJson('/api/transactions?per_page=500')
            ->assertJsonPath('errors.per_page.0', 'Jumlah per halaman harus antara 1 dan 100.');

        $this->postJson('/api/auth/register', ['name' => 'X', 'email' => 'x@pidu.test', 'password' => 'pendek', 'password_confirmation' => 'pendek'])
            ->assertJsonPath('errors.password.0', 'Password minimal 8 karakter.');
    }

    public function test_category_type_must_match_transaction_type(): void
    {
        $this->postJson('/api/transactions', $this->payload(['type' => 'income', 'category_id' => $this->food->id]))
            ->assertStatus(422)->assertJsonValidationErrors('category_id');

        $this->postJson('/api/transactions', $this->payload(['type' => 'income', 'category_id' => $this->salary->id]))
            ->assertCreated();
    }

    public function test_required_fields_and_formats(): void
    {
        $this->postJson('/api/transactions', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transaction_date', 'type', 'category_id', 'amount']);

        $this->postJson('/api/transactions', $this->payload(['transaction_date' => '10/09/2026', 'payment_method' => 'bitcoin']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transaction_date', 'payment_method']);
    }

    public function test_inactive_category_rules(): void
    {
        $id = $this->postJson('/api/transactions', $this->payload())->json('data.id');
        $this->food->update(['is_active' => false]);

        // create dengan kategori nonaktif → ditolak
        $this->postJson('/api/transactions', $this->payload())->assertStatus(422);

        // update tanpa mengganti kategori → boleh
        $this->putJson("/api/transactions/$id", $this->payload(['amount' => 1]))->assertOk();

        // pindah ke kategori nonaktif lain → ditolak
        $other = Category::factory()->inactive()->create(['user_id' => $this->user->id]);
        $this->putJson("/api/transactions/$id", $this->payload(['category_id' => $other->id]))->assertStatus(422);
    }

    public function test_index_pagination_filter_search_and_summary(): void
    {
        foreach (range(1, 20) as $d) {
            Transaction::factory()->create([
                'user_id' => $this->user->id, 'category_id' => $this->food->id,
                'transaction_date' => sprintf('2026-09-%02d', $d), 'amount' => 1000,
                'description' => $d === 5 ? 'Nasi Padang' : 'Jajan',
            ]);
        }
        Transaction::factory()->income()->create([
            'user_id' => $this->user->id, 'category_id' => $this->salary->id,
            'transaction_date' => '2026-09-25', 'amount' => 50000, 'payment_method' => 'transfer',
        ]);

        $res = $this->getJson('/api/transactions?per_page=5&page=2')->assertOk();
        $res->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 21)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('period', null)
            ->assertJsonPath('summary', ['income' => 50000, 'expense' => 20000, 'balance' => 30000, 'count' => 21]);

        // default sort: transaction_date desc
        $this->getJson('/api/transactions?per_page=1')->assertJsonPath('data.0.transaction_date', '2026-09-25');
        $this->getJson('/api/transactions?per_page=1&sort=amount&dir=asc')->assertJsonPath('data.0.amount', 1000);

        $this->getJson('/api/transactions?search=padang')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.description', 'Nasi Padang');

        $this->getJson('/api/transactions?type=income')->assertJsonPath('summary.count', 1);
        $this->getJson('/api/transactions?payment_method=transfer')->assertJsonPath('summary.income', 50000);
        $this->getJson("/api/transactions?category_id={$this->food->id}")->assertJsonPath('summary.count', 20);

        // periode inklusif di kedua ujung
        $this->getJson('/api/transactions?start_date=2026-09-01&end_date=2026-09-10')
            ->assertJsonPath('summary.count', 10)
            ->assertJsonPath('period.days', 10);

        $this->getJson('/api/transactions?per_page=500&sort=hacker')
            ->assertStatus(422)->assertJsonValidationErrors(['per_page', 'sort']);
        $this->getJson('/api/transactions?start_date=2026-09-10&end_date=2026-09-01')
            ->assertStatus(422)->assertJsonValidationErrors('end_date');
        $this->getJson('/api/transactions?start_date=2020-01-01&end_date=2026-01-02')
            ->assertStatus(422)->assertJsonValidationErrors('end_date');
    }
}
