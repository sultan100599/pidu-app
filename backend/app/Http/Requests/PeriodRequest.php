<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use App\Support\Period;
use Carbon\CarbonImmutable;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Periode (start_date/end_date | year+month | year | default bulan ini) + filter umum.
 */
class PeriodRequest extends ApiRequest
{
    /** Tanpa input periode → null (semua tanggal) alih-alih bulan berjalan. */
    protected bool $nullPeriodWhenEmpty = false;

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date_format:Y-m-d', 'required_with:end_date'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'required_with:start_date', 'after_or_equal:start_date'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'type' => ['nullable', Rule::enum(TransactionType::class)],
            'category_id' => [
                'nullable', 'integer',
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['start_date', 'end_date'])) {
                    return;
                }
                $start = $this->input('start_date');
                $end = $this->input('end_date');
                if ($start && $end
                    && CarbonImmutable::parse($end)->gt(CarbonImmutable::parse($start)->addYears(5))) {
                    $validator->errors()->add('end_date', 'Rentang tanggal maksimal 5 tahun.');
                }
            },
        ];
    }

    public function period(): ?Period
    {
        $input = $this->safe()->only(['start_date', 'end_date', 'year', 'month']);

        // month tanpa year → tahun berjalan
        if (! empty($input['month']) && empty($input['year'])) {
            $input['year'] = CarbonImmutable::today()->year;
        }

        return Period::fromInput($input, $this->nullPeriodWhenEmpty);
    }

    /**
     * @return array{type?:string, category_id?:int, payment_method?:string, search?:string}
     */
    public function filters(): array
    {
        return array_filter(
            $this->safe()->only(['type', 'category_id', 'payment_method', 'search']),
            fn ($v) => $v !== null && $v !== ''
        );
    }
}
