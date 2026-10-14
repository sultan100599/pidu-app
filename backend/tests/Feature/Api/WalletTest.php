<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $food;

    private Category $sales;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-14 10:00:00');
        $this->user = User::factory()->create(['opening_balance' => 0]);
        Sanctum::actingAs($this->user);
        $this->food = Category::factory()->create(['user_id' => $this->user->id, 'name' => 'Makanan']);
        $this->sales = Category::factory()->income()->create(['user_id' => $this->user->id, 'name' => 'Hasil Jualan']);
    }

    private function wallet(array $data): int
    {
        return $this->postJson('/api/wallets', $data + ['kind' => 'cash', 'purpose' => 'personal'])
            ->assertCreated()
            ->json('data.id');
    }

    private function trx(int $walletId, string $type, int $amount, string $date = '2026-10-10'): void
    {
        $this->postJson('/api/transactions', [
            'transaction_date' => $date,
            'type' => $type,
            'category_id' => ($type === 'income' ? $this->sales : $this->food)->id,
            'wallet_id' => $walletId,
            'amount' => $amount,
        ])->assertCreated()->assertJsonPath('data.wallet.id', $walletId);
    }

    public function test_index_creates_main_wallet_and_transactions_default_to_it(): void
    {
        $this->getJson('/api/wallets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Dompet Utama')
            ->assertJsonPath('data.0.balance', 0);

        $this->postJson('/api/transactions', [
            'transaction_date' => '2026-10-10', 'type' => 'expense', 'category_id' => $this->food->id, 'amount' => 5000,
        ])->assertCreated()->assertJsonPath('data.wallet.name', 'Dompet Utama');
    }

    public function test_balances_per_wallet_with_transfers_and_purpose_filter(): void
    {
        $cash = $this->wallet(['name' => 'Tunai', 'opening_balance' => 100000]);
        $shop = $this->wallet(['name' => 'Kas Warung', 'purpose' => 'business', 'kind' => 'cash', 'opening_balance' => 500000]);

        $this->trx($cash, 'expense', 20000);
        $this->trx($shop, 'income', 300000);
        $this->trx($shop, 'expense', 50000);
        $this->trx($shop, 'income', 999999, '2026-10-20'); // masa depan, belum dihitung

        $this->postJson('/api/transfers', [
            'from_wallet_id' => $shop, 'to_wallet_id' => $cash, 'amount' => 150000, 'transfer_date' => '2026-10-11',
        ])->assertCreated()->assertJsonPath('data.from_wallet.name', 'Kas Warung');

        $balances = collect($this->getJson('/api/wallets')->assertOk()->json('data'))->pluck('balance', 'name');
        $this->assertEquals(230000, $balances['Tunai']);
        $this->assertEquals(600000, $balances['Kas Warung']);

        $this->getJson('/api/dashboard?start_date=2026-10-01&end_date=2026-10-31')
            ->assertJsonPath('wallet.current_balance', 830000)
            ->assertJsonPath('summary.income', 1299999);

        // Usaha saja: saldo dompet usaha, pemasukan/pengeluaran hanya dari dompet usaha.
        $this->getJson('/api/dashboard?start_date=2026-10-01&end_date=2026-10-31&purpose=business')
            ->assertJsonPath('wallet.current_balance', 600000)
            ->assertJsonPath('wallet.opening_balance', 500000)
            ->assertJsonCount(1, 'wallet.wallets')
            ->assertJsonPath('summary.expense', 50000);

        $this->getJson('/api/reports/daily?start_date=2026-10-10&end_date=2026-10-10&purpose=personal')
            ->assertJsonPath('totals.expense', 20000)
            ->assertJsonPath('totals.income', 0);

        $this->getJson("/api/transactions?wallet_id=$cash")->assertJsonPath('summary.count', 1);
    }

    public function test_transfer_validation(): void
    {
        $cash = $this->wallet(['name' => 'Tunai']);
        $other = User::factory()->create();
        $foreign = $other->wallets()->create(['name' => 'Milik orang', 'kind' => 'cash', 'purpose' => 'personal'])->id;

        $this->postJson('/api/transfers', ['from_wallet_id' => $cash, 'to_wallet_id' => $cash, 'amount' => 1000, 'transfer_date' => '2026-10-14'])
            ->assertStatus(422)
            ->assertJsonPath('errors.to_wallet_id.0', 'Dompet asal dan tujuan harus berbeda.');
        $this->postJson('/api/transfers', ['from_wallet_id' => $cash, 'to_wallet_id' => $foreign, 'amount' => 1000, 'transfer_date' => '2026-10-14'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('to_wallet_id');
        $this->postJson('/api/transfers', ['from_wallet_id' => $cash, 'amount' => 0])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['to_wallet_id', 'amount', 'transfer_date']);
    }

    public function test_archive_delete_and_rename_rules(): void
    {
        $main = $this->getJson('/api/wallets')->json('data.0.id');
        $spare = $this->wallet(['name' => 'Cadangan']);

        $this->postJson('/api/wallets', ['name' => 'Cadangan', 'kind' => 'bank', 'purpose' => 'personal'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'Nama dompet sudah dipakai.');

        $this->trx($main, 'expense', 1000);
        $this->deleteJson("/api/wallets/$main")->assertStatus(422)->assertJsonValidationErrors('wallet');

        $this->patchJson("/api/wallets/$main/toggle")->assertOk()->assertJsonPath('data.is_active', false);
        // Dompet terakhir yang aktif tidak bisa diarsipkan / dihapus.
        $this->patchJson("/api/wallets/$spare/toggle")->assertStatus(422)->assertJsonPath('errors.wallet.0', 'Harus ada minimal satu dompet yang dipakai.');
        $this->deleteJson("/api/wallets/$spare")->assertStatus(422);

        // Dompet arsip tidak bisa dipilih untuk transaksi baru, tapi transaksi lamanya tetap bisa diedit.
        $this->postJson('/api/transactions', [
            'transaction_date' => '2026-10-10', 'type' => 'expense', 'category_id' => $this->food->id, 'wallet_id' => $main, 'amount' => 5000,
        ])->assertStatus(422)->assertJsonValidationErrors('wallet_id');
        $old = Transaction::where('wallet_id', $main)->firstOrFail();
        $this->putJson("/api/transactions/{$old->id}", [
            'transaction_date' => '2026-10-10', 'type' => 'expense', 'category_id' => $this->food->id, 'wallet_id' => $main, 'amount' => 7000,
        ])->assertOk();

        $this->putJson("/api/wallets/$spare", ['name' => 'Rekening BRI', 'kind' => 'bank', 'purpose' => 'business'])
            ->assertOk()
            ->assertJsonPath('data.purpose', 'business')
            ->assertJsonPath('data.opening_balance', 0);

        $this->patchJson("/api/wallets/$main/toggle")->assertOk()->assertJsonPath('data.is_active', true);
        $this->deleteJson("/api/wallets/$spare")->assertOk();
    }

    public function test_opening_balance_answer_goes_to_main_wallet(): void
    {
        $user = User::factory()->create(['opening_balance' => null]);
        Sanctum::actingAs($user);

        $this->getJson('/api/dashboard')->assertJsonPath('wallet.opening_balance', null);
        $this->putJson('/api/account', ['opening_balance' => 250000])->assertOk();

        $this->getJson('/api/wallets')->assertJsonPath('data.0.opening_balance', 250000);
        $this->getJson('/api/dashboard')
            ->assertJsonPath('wallet.opening_balance', 250000)
            ->assertJsonPath('wallet.current_balance', 250000);
    }

    public function test_wallets_are_private(): void
    {
        $other = User::factory()->create();
        $foreign = $other->wallets()->create(['name' => 'Rahasia', 'kind' => 'cash', 'purpose' => 'personal']);
        $transfer = $other->transfers()->create([
            'from_wallet_id' => $foreign->id, 'to_wallet_id' => $foreign->id, 'amount' => 1, 'transfer_date' => '2026-10-01',
        ]);

        $this->putJson("/api/wallets/{$foreign->id}", ['name' => 'X', 'kind' => 'cash', 'purpose' => 'personal'])->assertNotFound();
        $this->deleteJson("/api/wallets/{$foreign->id}")->assertNotFound();
        $this->deleteJson("/api/transfers/{$transfer->id}")->assertNotFound();
        $this->getJson("/api/transactions?wallet_id={$foreign->id}")->assertStatus(422);
        $this->getJson('/api/transfers')->assertJsonCount(0, 'data');
    }

    public function test_register_creates_main_wallet(): void
    {
        $this->postJson('/api/auth/register', ['name' => 'Bu Sari', 'email' => 'sari@pidu.test', 'password' => 'rahasia123'])
            ->assertCreated();

        $this->assertSame(['Dompet Utama'], User::where('email', 'sari@pidu.test')->firstOrFail()->wallets()->pluck('name')->all());
    }
}
