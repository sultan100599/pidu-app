<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Transfer = 'transfer';
    case Debit = 'debit';
    case CreditCard = 'credit_card';
    case EWallet = 'e_wallet';
    case Qris = 'qris';
    case Other = 'other';

    public function label(?string $locale = null): string
    {
        return __('messages.'.$this->value, [], $locale);
    }
}
