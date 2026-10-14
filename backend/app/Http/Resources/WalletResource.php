<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'kind' => $this->kind->value,
            'purpose' => $this->purpose->value,
            'opening_balance' => Money::of($this->opening_balance),
            'is_active' => $this->is_active,
            'balance' => $this->when($this->resource->hasAttribute('balance'), fn () => $this->balance),
            'transactions_count' => $this->whenCounted('transactions'),
            'in_use' => $this->when(
                $this->resource->hasAttribute('transactions_exists'),
                fn () => $this->transactions_exists || $this->transfers_out_exists || $this->transfers_in_exists || $this->recurring_transactions_exists,
            ),
        ];
    }
}
