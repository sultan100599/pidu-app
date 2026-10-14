<?php

namespace App\Http\Requests;

use App\Enums\WalletKind;
use App\Enums\WalletPurpose;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class StoreWalletRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', $this->uniqueName()],
            'kind' => ['required', Rule::enum(WalletKind::class)],
            'purpose' => ['required', Rule::enum(WalletPurpose::class)],
            'opening_balance' => ['nullable', 'numeric', 'min:0', 'max:999999999999', 'decimal:0,2'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'name.unique' => __('validation.custom_messages.wallet_duplicate'),
        ]);
    }

    protected function uniqueName(): Unique
    {
        return Rule::unique('wallets', 'name')->where('user_id', $this->user()->id);
    }

    public function payload(): array
    {
        $data = $this->validated();
        $data['opening_balance'] ??= 0;

        return $data;
    }
}
