<?php

namespace App\Http\Requests;

use App\Models\Wallet;
use Illuminate\Validation\Rules\Unique;

class UpdateWalletRequest extends StoreWalletRequest
{
    private ?Wallet $wallet = null;

    public function wallet(): Wallet
    {
        return $this->wallet ??= $this->user()->wallets()->findOrFail($this->route('id'));
    }

    protected function uniqueName(): Unique
    {
        return parent::uniqueName()->ignore($this->wallet()->id);
    }

    public function payload(): array
    {
        $data = $this->validated();
        if (array_key_exists('opening_balance', $data)) {
            $data['opening_balance'] ??= 0;
        }

        return $data;
    }
}
