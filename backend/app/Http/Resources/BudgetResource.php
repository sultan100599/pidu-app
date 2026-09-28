<?php

namespace App\Http\Resources;

use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Budget + pemakaian. `used` di-set oleh BudgetService (atribut non-kolom).
 */
class BudgetResource extends JsonResource
{
    public const WARNING_AT = 80;

    public const EXCEEDED_AT = 100;

    public function toArray(Request $request): array
    {
        $amount = Money::of($this->amount);
        $used = Money::of($this->used ?? 0);
        $percentage = Money::percent($used, $amount);

        return [
            'id' => $this->id,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'icon' => $this->category->icon,
                'color' => $this->category->color,
                'type' => $this->category->type->value,
            ]),
            'month' => $this->month,
            'year' => $this->year,
            'amount' => $amount,
            'used' => $used,
            'remaining' => Money::of($amount - $used),
            'percentage' => $percentage,
            'status' => self::status($percentage),
        ];
    }

    public static function status(float $percentage): string
    {
        return match (true) {
            $percentage >= self::EXCEEDED_AT => 'exceeded',
            $percentage >= self::WARNING_AT => 'warning',
            default => 'ok',
        };
    }
}
