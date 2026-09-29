<?php

namespace App\Enums;

enum TransactionType: string
{
    case Income = 'income';
    case Expense = 'expense';

    public function label(?string $locale = null): string
    {
        return __('messages.'.$this->value, [], $locale);
    }
}
