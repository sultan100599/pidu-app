<?php

namespace App\Http\Requests;

use App\Models\RecurringTransaction;

/**
 * Jadwal (frequency, start_date) tidak bisa diubah; perubahan lain berlaku untuk jadwal berikutnya.
 */
class UpdateRecurringRequest extends StoreRecurringRequest
{
    private ?RecurringTransaction $rule = null;

    public function recurring(): RecurringTransaction
    {
        return $this->rule ??= $this->user()->recurringTransactions()->findOrFail($this->route('id'));
    }

    public function rules(): array
    {
        return array_diff_key(parent::rules(), array_flip(['frequency', 'start_date']));
    }

    protected function keepsCurrent(string $field): bool
    {
        return (int) $this->input($field) === $this->recurring()->{$field};
    }
}
