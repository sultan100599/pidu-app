<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Validator;

class UpdatePasswordRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }
                if (! Hash::check($this->input('current_password'), $this->user()->password)) {
                    $validator->errors()->add('current_password', __('validation.custom_messages.current_password_wrong'));
                } elseif ($this->input('current_password') === $this->input('password')) {
                    $validator->errors()->add('password', __('validation.custom_messages.password_same'));
                }
            },
        ];
    }
}
