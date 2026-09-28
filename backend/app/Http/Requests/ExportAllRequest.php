<?php

namespace App\Http\Requests;

class ExportAllRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'year' => ['nullable', 'integer', 'between:2000,2100'],
        ];
    }

    public function year(): int
    {
        return (int) ($this->validated('year') ?? now()->year);
    }
}
