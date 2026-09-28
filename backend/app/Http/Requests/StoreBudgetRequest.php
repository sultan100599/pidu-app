<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBudgetRequest extends ApiRequest
{
    public const DUPLICATE_MESSAGE = 'Budget kategori ini untuk bulan tersebut sudah ada.';

    public function rules(): array
    {
        return [
            'category_id' => [
                'required', 'integer',
                Rule::exists('categories', 'id')
                    ->where('user_id', $this->user()->id)
                    ->where('type', 'expense'),
            ],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999', 'decimal:0,2'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'amount.gt' => 'Nominal harus lebih dari 0.',
            'category_id.exists' => 'Kategori tidak ditemukan atau bukan kategori pengeluaran.',
        ]);
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }
                if ($this->isDuplicate(
                    (int) $this->input('category_id'),
                    (int) $this->input('month'),
                    (int) $this->input('year'),
                )) {
                    $validator->errors()->add('category_id', self::DUPLICATE_MESSAGE);
                }
            },
        ];
    }

    protected function isDuplicate(int $categoryId, int $month, int $year, ?int $ignoreId = null): bool
    {
        return $this->user()->budgets()
            ->where('category_id', $categoryId)
            ->where('month', $month)
            ->where('year', $year)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();
    }
}
