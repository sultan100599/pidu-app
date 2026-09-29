<?php

namespace App\Http\Requests;

use App\Models\Budget;
use Illuminate\Validation\Validator;

class UpdateBudgetRequest extends StoreBudgetRequest
{
    private ?Budget $budget = null;

    public function budget(): Budget
    {
        return $this->budget ??= $this->user()->budgets()->findOrFail($this->route('id'));
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999', 'decimal:0,2'],
            'month' => ['sometimes', 'integer', 'between:1,12'],
            'year' => ['sometimes', 'integer', 'between:2000,2100'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }
                $budget = $this->budget();
                if ($this->isDuplicate(
                    $budget->category_id,
                    (int) $this->input('month', $budget->month),
                    (int) $this->input('year', $budget->year),
                    $budget->id,
                )) {
                    $validator->errors()->add('month', __(self::DUPLICATE_MESSAGE));
                }
            },
        ];
    }
}
