<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreTransferRequest extends ApiRequest
{
    public function rules(): array
    {
        $wallet = fn () => Rule::exists('wallets', 'id')
            ->where('user_id', $this->user()->id)
            ->where('is_active', true);

        return [
            'from_wallet_id' => ['required', 'integer', $wallet()],
            'to_wallet_id' => ['required', 'integer', 'different:from_wallet_id', $wallet()],
            'transfer_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999', 'decimal:0,2'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'amount.gt' => __('validation.custom_messages.amount_positive'),
            'from_wallet_id.exists' => __('validation.custom_messages.wallet_invalid'),
            'to_wallet_id.exists' => __('validation.custom_messages.wallet_invalid'),
            'to_wallet_id.different' => __('validation.custom_messages.transfer_same'),
        ]);
    }
}
