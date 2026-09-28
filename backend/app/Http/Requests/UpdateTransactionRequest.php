<?php

namespace App\Http\Requests;

use App\Models\Transaction;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class UpdateTransactionRequest extends StoreTransactionRequest
{
    private ?Transaction $transaction = null;

    /**
     * Transaksi milik user yang sedang diedit (404 jika bukan miliknya).
     */
    public function transaction(): Transaction
    {
        return $this->transaction ??= $this->user()->transactions()->findOrFail($this->route('id'));
    }

    /**
     * Kategori nonaktif tetap boleh dipakai bila category_id tidak berubah.
     */
    protected function categoryRule(): Exists
    {
        $rule = Rule::exists('categories', 'id')
            ->where('user_id', $this->user()->id)
            ->where('type', (string) $this->input('type'));

        if ((int) $this->input('category_id') !== $this->transaction()->category_id) {
            $rule->where('is_active', true);
        }

        return $rule;
    }
}
