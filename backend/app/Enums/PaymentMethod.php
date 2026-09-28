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

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Transfer => 'Transfer',
            self::Debit => 'Debit',
            self::CreditCard => 'Kartu Kredit',
            self::EWallet => 'E-Wallet',
            self::Qris => 'QRIS',
            self::Other => 'Lainnya',
        };
    }
}
