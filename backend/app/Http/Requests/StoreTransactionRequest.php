<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class StoreTransactionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'transaction_date' => ['required', 'date_format:Y-m-d'],
            'type' => ['required', Rule::enum(TransactionType::class)],
            'category_id' => ['required', 'integer', $this->categoryRule()],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999', 'decimal:0,2'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'description' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'amount.gt' => 'Nominal harus lebih dari 0.',
            'category_id.exists' => 'Kategori tidak ditemukan, tidak aktif, atau tidak sesuai jenis transaksi.',
        ]);
    }

    /**
     * Kategori harus milik user, jenisnya sama dengan type, dan aktif.
     */
    protected function categoryRule(): Exists
    {
        return Rule::exists('categories', 'id')
            ->where('user_id', $this->user()->id)
            ->where('type', (string) $this->input('type'))
            ->where('is_active', true);
    }

    public function payload(): array
    {
        $data = $this->validated();
        $data['payment_method'] ??= PaymentMethod::Cash->value;

        return $data;
    }
}
