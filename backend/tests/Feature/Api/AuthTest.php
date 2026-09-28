<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_success_returns_token_and_user(): void
    {
        $user = User::factory()->create(['email' => 'a@pidu.test']);

        $this->postJson('/api/auth/login', ['email' => 'a@pidu.test', 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']])
            ->assertJsonPath('user.id', $user->id);
    }

    public function test_login_wrong_password_returns_422(): void
    {
        User::factory()->create(['email' => 'a@pidu.test']);

        $this->postJson('/api/auth/login', ['email' => 'a@pidu.test', 'password' => 'salah'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Email atau password salah.')
            ->assertJsonValidationErrors('email');
    }

    public function test_protected_route_without_token_returns_401_json(): void
    {
        $this->getJson('/api/auth/me')
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Unauthenticated.']);

        $this->getJson('/api/transactions')->assertStatus(401);
    }

    public function test_me_returns_current_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_token_expires_after_configured_lifetime(): void
    {
        config(['sanctum.expiration' => 60]);
        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->getJson('/api/auth/me')->assertOk();

        $this->travel(61)->minutes();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_register_creates_user_with_default_categories(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Baru',
            'email' => 'baru@pidu.test',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
        ])->assertCreated()->assertJsonStructure(['token', 'user']);

        $user = User::where('email', 'baru@pidu.test')->firstOrFail();
        $this->assertSame(22, $user->categories()->count());
    }

    public function test_login_is_throttled(): void
    {
        User::factory()->create(['email' => 'a@pidu.test']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'a@pidu.test', 'password' => 'x'])->assertStatus(422);
        }

        $this->postJson('/api/auth/login', ['email' => 'a@pidu.test', 'password' => 'x'])->assertStatus(429);
    }
}
