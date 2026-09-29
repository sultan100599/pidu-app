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
            'file.extensions' => __('validation.extensions'),
            'file.max' => __('validation.custom_messages.file_size'),
        ]);
    }

    public function attributes(): array
    {
        return array_merge(parent::attributes(), ['file' => __('validation.attributes.file')]);
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
