<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ErrorHandlingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['app.debug' => false]);

        Route::get('api/_test/query-error', fn () => DB::select('SELECT * FROM tabel_tidak_ada'));
        Route::get('api/_test/runtime-error', fn () => throw new RuntimeException('rahasia internal'));
    }

    public function test_query_exception_returns_generic_500(): void
    {
        $this->getJson('/api/_test/query-error')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Terjadi kesalahan pada server.']);
    }

    public function test_other_exception_does_not_leak_details(): void
    {
        $res = $this->getJson('/api/_test/runtime-error')->assertStatus(500);

        $res->assertExactJson(['message' => 'Terjadi kesalahan pada server.']);
        $this->assertStringNotContainsString('rahasia', $res->getContent());
    }

    public function test_unknown_endpoint_returns_json_404(): void
    {
        $this->getJson('/api/tidak-ada')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Endpoint tidak ditemukan.']);
    }
}
