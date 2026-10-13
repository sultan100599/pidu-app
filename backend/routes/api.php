<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::pattern('id', '[0-9]+');

Route::prefix('auth')->group(function () {
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('register', [AuthController::class, 'register']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::put('account', [AccountController::class, 'update']);
    Route::put('account/password', [AccountController::class, 'password'])->middleware('throttle:5,1');

    Route::get('transactions', [TransactionController::class, 'index']);
    Route::post('transactions', [TransactionController::class, 'store']);
    Route::get('transactions/{id}', [TransactionController::class, 'show']);
    Route::put('transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('transactions/{id}', [TransactionController::class, 'destroy']);

    Route::get('categories', [CategoryController::class, 'index']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::patch('categories/{id}/toggle', [CategoryController::class, 'toggle']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

    Route::get('dashboard', DashboardController::class);

    Route::prefix('reports')->controller(ReportController::class)->group(function () {
        Route::get('daily', 'daily');
        Route::get('weekly', 'weekly');
        Route::get('monthly', 'monthly');
        Route::get('yearly', 'yearly');
        Route::get('calendar', 'calendar');
        Route::get('day/{date}', 'day');
    });

    Route::get('budgets', [BudgetController::class, 'index']);
    Route::post('budgets', [BudgetController::class, 'store']);
    Route::put('budgets/{id}', [BudgetController::class, 'update']);
    Route::delete('budgets/{id}', [BudgetController::class, 'destroy']);

    // Export berat → dibatasi 10x/menit per user.
    Route::prefix('export')->controller(ExportController::class)->middleware('throttle:10,1')->group(function () {
        Route::get('excel', 'excel');
        Route::get('pdf', 'pdf');
        Route::get('all', 'all');
    });

    Route::prefix('import')->controller(ImportController::class)->middleware('throttle:10,1')->group(function () {
        Route::get('template', 'template');
        Route::post('transactions', 'transactions');
    });

    Route::prefix('backups')->controller(BackupController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store')->middleware('throttle:5,1');
        Route::get('{name}', 'download')->where('name', 'pidu-backup-[0-9]{8}-[0-9]{6}\.xlsx');
    });
});
