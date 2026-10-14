<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transfer_date' => $this->transfer_date->toDateString(),
            'amount' => Money::of($this->amount),
            'description' => $this->description,
            'from_wallet' => $this->whenLoaded('fromWallet', fn () => ['id' => $this->fromWallet->id, 'name' => $this->fromWallet->name]),
            'to_wallet' => $this->whenLoaded('toWallet', fn () => ['id' => $this->toWallet->id, 'name' => $this->toWallet->name]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
