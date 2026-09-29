<?php

namespace App\Http\Requests;

class ImportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'extensions:xlsx,xls,csv', 'max:5120'],
            'dry_run' => ['nullable', 'boolean'],
            'skip_duplicates' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'file.extensions' => 'File harus berformat .xlsx, .xls, atau .csv.',
            'file.max' => 'Ukuran file maksimal 5 MB.',
        ]);
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), ['file' => 'file']);
    }

    public function dryRun(): bool
    {
        return $this->boolean('dry_run', true);
    }

    public function skipDuplicates(): bool
    {
        return $this->boolean('skip_duplicates', true);
    }
}
