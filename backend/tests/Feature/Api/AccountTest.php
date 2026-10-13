<?php

namespace Tests\Feature\Api;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_opening_balance_is_saved_and_counted_in_current_balance(): void
    {
        $this->travelTo('2026-10-13 10:00:00');
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $income = Category::factory()->income()->create(['user_id' => $user->id]);
        $expense = Category::factory()->create(['user_id' => $user->id]);
        $rows = [
            ['income', $income, '2026-09-01', 300000],
            ['expense', $expense, '2026-10-12', 50000],
            ['expense', $expense, '2026-10-20', 999999],
        ];
        foreach ($rows as [$type, $category, $date, $amount]) {
            Transaction::factory()->create([
                'user_id' => $user->id, 'type' => $type, 'category_id' => $category->id,
                'transaction_date' => $date, 'amount' => $amount,
            ]);
        }

        $this->getJson('/api/dashboard')
            ->assertJsonPath('wallet.opening_balance', null)
            ->assertJsonPath('wallet.current_balance', 250000);

        $this->putJson('/api/account', ['opening_balance' => 1000000])
            ->assertOk()
            ->assertJsonPath('data.opening_balance', 1000000);

        // Transaksi 20 Okt (masa depan) belum dihitung; periode dashboard tidak memengaruhi saldo.
        $this->getJson('/api/dashboard?start_date=2026-10-01&end_date=2026-10-31')
            ->assertJsonPath('wallet.opening_balance', 1000000)
            ->assertJsonPath('wallet.current_balance', 1250000)
            ->assertJsonPath('summary.balance', -1049999);
    }

    public function test_opening_balance_validation(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/account', ['opening_balance' => -5])->assertStatus(422)->assertJsonValidationErrors('opening_balance');
        $this->putJson('/api/account', ['opening_balance' => 'abc'])->assertStatus(422);
        $this->putJson('/api/account', ['name' => ''])->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_change_password_checks_current_and_revokes_other_sessions(): void
    {
        $user = User::factory()->create();
        $other = $user->createToken('hp')->plainTextToken;
        $current = $user->createToken('laptop')->plainTextToken;

        $this->withToken($current)
            ->putJson('/api/account/password', ['current_password' => 'salah', 'password' => 'barubaru1'])
            ->assertStatus(422)
            ->assertJsonPath('errors.current_password.0', 'Password lama salah.');
        $this->withToken($current)
            ->putJson('/api/account/password', ['current_password' => 'password', 'password' => 'password'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');

        $this->withToken($current)
            ->putJson('/api/account/password', ['current_password' => 'password', 'password' => 'barubaru1'])
            ->assertOk()
            ->assertJsonPath('message', 'Password berhasil diganti.');

        $this->assertTrue(Hash::check('barubaru1', $user->fresh()->password));
        $this->assertSame(1, $user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->withToken($other)->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_forgot_password_sends_link_without_revealing_accounts(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'ibu@pidu.test']);
        $message = 'Jika email itu terdaftar, link untuk mengatur ulang password sudah dikirim. Cek kotak masuk atau folder spam.';

        $this->postJson('/api/auth/forgot-password', ['email' => 'ibu@pidu.test'])->assertOk()->assertJsonPath('message', $message);
        $this->postJson('/api/auth/forgot-password', ['email' => 'tidakada@pidu.test'])->assertOk()->assertJsonPath('message', $message);

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;

            return str_starts_with($url, 'http://localhost:8010/reset-password?token=')
                && str_contains($url, 'email=ibu%40pidu.test');
        });
        Notification::assertCount(1);
    }

    public function test_reset_password_with_valid_and_invalid_token(): void
    {
        $user = User::factory()->create(['email' => 'ibu@pidu.test']);
        $user->createToken('lama');
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', ['token' => 'palsu', 'email' => 'ibu@pidu.test', 'password' => 'barubaru1'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson('/api/auth/reset-password', ['token' => $token, 'email' => 'ibu@pidu.test', 'password' => 'barubaru1'])
            ->assertOk()
            ->assertJsonPath('message', 'Password baru sudah disimpan. Silakan masuk.');

        $this->assertTrue(Hash::check('barubaru1', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/auth/login', ['email' => 'ibu@pidu.test', 'password' => 'barubaru1'])->assertOk();
    }

    public function test_budget_index_reports_previous_month_count(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $food = Category::factory()->create(['user_id' => $user->id]);
        Budget::factory()->create(['user_id' => $user->id, 'category_id' => $food->id, 'month' => 9, 'year' => 2026, 'amount' => 100000]);

        $this->getJson('/api/budgets?year=2026&month=10')->assertJsonPath('previous_month_count', 1);
        $this->getJson('/api/budgets?year=2026&month=9')->assertJsonPath('previous_month_count', 0);
    }
}
