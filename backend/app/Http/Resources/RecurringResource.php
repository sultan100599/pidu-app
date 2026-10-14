<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecurringResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'amount' => Money::of($this->amount),
            'payment_method' => $this->payment_method->value,
            'description' => $this->description,
            'notes' => $this->notes,
            'frequency' => $this->frequency->value,
            'start_date' => $this->start_date->toDateString(),
            'next_date' => $this->next_date->toDateString(),
            'run_count' => $this->run_count,
            'is_active' => $this->is_active,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'icon' => $this->category->icon,
                'color' => $this->category->color,
                'type' => $this->category->type->value,
                'is_active' => $this->category->is_active,
            ]),
            'wallet' => $this->whenLoaded('wallet', fn () => [
                'id' => $this->wallet->id,
                'name' => $this->wallet->name,
                'is_active' => $this->wallet->is_active,
            ]),
        ];
    }
}
