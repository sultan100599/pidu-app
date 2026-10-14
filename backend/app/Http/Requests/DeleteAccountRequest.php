<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Validator;

class DeleteAccountRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'password' => ['required', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (! $validator->errors()->has('password') && ! Hash::check($this->input('password'), $this->user()->password)) {
                    $validator->errors()->add('password', __('validation.custom_messages.current_password_wrong'));
                }
            },
        ];
    }
}
