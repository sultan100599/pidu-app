<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'transaction_date',
        'type',
        'amount',
        'payment_method',
        'description',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'amount' => 'decimal:2',
            'type' => TransactionType::class,
            'payment_method' => PaymentMethod::class,
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

    /**
     * Simpan selalu sebagai 'Y-m-d' (tanpa jam) supaya perbandingan string di SQLite konsisten.
     */
    protected function transactionDate(): Attribute
    {
        return Attribute::set(
            fn ($value) => $value === null ? null : Carbon::parse($value)->toDateString()
        );
    }

    public function scopeBetween(Builder $query, $start, $end): Builder
    {
        return $query->whereBetween($query->qualifyColumn('transaction_date'), [$start, $end]);
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where($query->qualifyColumn('type'), $type);
    }

    /**
     * Filter umum: type, category_id, payment_method, search (description/notes).
     * Kolom di-qualify agar aman saat di-join dengan categories.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['type'] ?? null, fn ($q, $type) => $q->ofType($type))
            ->when($filters['category_id'] ?? null, fn ($q, $id) => $q->where($q->qualifyColumn('category_id'), $id))
            ->when($filters['payment_method'] ?? null, fn ($q, $pm) => $q->where($q->qualifyColumn('payment_method'), $pm))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $like = '%'.$search.'%';
                $q->where(function ($sub) use ($like) {
                    $sub->where($sub->qualifyColumn('description'), 'like', $like)
                        ->orWhere($sub->qualifyColumn('notes'), 'like', $like);
                });
            });
    }
}
