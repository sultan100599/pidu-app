<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'opening_balance' => $this->opening_balance === null ? null : (float) $this->opening_balance,
            'reminder_hour' => $this->reminder_hour,
        ];
    }
}
