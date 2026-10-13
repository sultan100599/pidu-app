<?php

namespace App\Http\Requests;

class UpdateAccountRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'opening_balance' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999999999'],
        ];
    }
}
