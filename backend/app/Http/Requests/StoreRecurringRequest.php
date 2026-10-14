<?php

namespace App\Http\Requests;

use App\Enums\Frequency;
use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use Carbon\CarbonImmutable;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class StoreRecurringRequest extends ApiRequest
{
    public function rules(): array
    {
        $today = CarbonImmutable::today();

        return [
            'type' => ['required', Rule::enum(TransactionType::class)],
            'category_id' => ['required', 'integer', $this->categoryRule()],
            'wallet_id' => ['nullable', 'integer', $this->walletRule()],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999', 'decimal:0,2'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'description' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'frequency' => ['required', Rule::enum(Frequency::class)],
            'start_date' => [
                'required', 'date_format:Y-m-d',
                'after_or_equal:'.$today->subYear()->toDateString(),
                'before_or_equal:'.$today->addYear()->toDateString(),
            ],
        ];
    }

    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'amount.gt' => __('validation.custom_messages.amount_positive'),
            'category_id.exists' => __('validation.custom_messages.transaction_category'),
            'wallet_id.exists' => __('validation.custom_messages.wallet_invalid'),
            'start_date.after_or_equal' => __('validation.custom_messages.recurring_start'),
            'start_date.before_or_equal' => __('validation.custom_messages.recurring_start'),
        ]);
    }

    protected function categoryRule(): Exists
    {
        $rule = Rule::exists('categories', 'id')
            ->where('user_id', $this->user()->id)
            ->where('type', (string) $this->input('type'));

        return $this->keepsCurrent('category_id') ? $rule : $rule->where('is_active', true);
    }

    protected function walletRule(): Exists
    {
        $rule = Rule::exists('wallets', 'id')->where('user_id', $this->user()->id);

        return $this->keepsCurrent('wallet_id') ? $rule : $rule->where('is_active', true);
    }

    /**
     * Saat edit, kategori/dompet yang sudah disembunyikan tetap boleh selama tidak diganti.
     */
    protected function keepsCurrent(string $field): bool
    {
        return false;
    }

    public function payload(): array
    {
        $data = $this->validated();
        $data['payment_method'] ??= PaymentMethod::Cash->value;

        return $data;
    }
}
