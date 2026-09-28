<?php

namespace App\Http\Requests;

class TransactionIndexRequest extends PeriodRequest
{
    protected bool $nullPeriodWhenEmpty = true;

    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:transaction_date,amount,created_at'],
            'dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
    }

    public function sort(): string
    {
        return $this->validated('sort') ?? 'transaction_date';
    }

    public function dir(): string
    {
        return $this->validated('dir') ?? 'desc';
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? 15);
    }
}
