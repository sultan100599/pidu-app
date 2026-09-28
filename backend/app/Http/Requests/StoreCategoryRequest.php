<?php

namespace App\Http\Requests;

use App\Enums\TransactionType;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

class StoreCategoryRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', $this->uniqueName()],
            'type' => ['required', Rule::enum(TransactionType::class)],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'name.unique' => 'Nama kategori sudah ada untuk jenis ini.',
        ]);
    }

    protected function uniqueName(): Unique
    {
        return Rule::unique('categories', 'name')
            ->where('user_id', $this->user()->id)
            ->where('type', (string) $this->input('type'));
    }
}
