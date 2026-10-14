<?php

namespace App\Models;

use App\Enums\Frequency;
use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class RecurringTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'wallet_id',
        'type',
        'amount',
        'payment_method',
        'description',
        'notes',
        'frequency',
        'start_date',
        'run_count',
        'next_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => TransactionType::class,
            'payment_method' => PaymentMethod::class,
            'frequency' => Frequency::class,
            'amount' => 'decimal:2',
            'start_date' => 'immutable_date',
            'next_date' => 'immutable_date',
            'run_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Jadwal berikutnya setelah $runs kali dijalankan.
     */
    public function occurrence(int $runs): CarbonImmutable
    {
        return $this->frequency->occurrence(CarbonImmutable::parse($this->start_date->toDateString()), $runs);
    }

    protected function startDate(): Attribute
    {
        return Attribute::set(fn ($value) => $value === null ? null : Carbon::parse($value)->toDateString());
    }

    protected function nextDate(): Attribute
    {
        return Attribute::set(fn ($value) => $value === null ? null : Carbon::parse($value)->toDateString());
    }
}
