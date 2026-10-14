<?php

namespace App\Models;

use App\Enums\WalletKind;
use App\Enums\WalletPurpose;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasFactory;

    public const DEFAULT_NAME = 'Dompet Utama';

    protected $fillable = [
        'name',
        'kind',
        'purpose',
        'opening_balance',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'kind' => WalletKind::class,
            'purpose' => WalletPurpose::class,
            'opening_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function transfersOut()
    {
        return $this->hasMany(Transfer::class, 'from_wallet_id');
    }

    public function transfersIn()
    {
        return $this->hasMany(Transfer::class, 'to_wallet_id');
    }

    public function recurringTransactions()
    {
        return $this->hasMany(RecurringTransaction::class);
    }
}
