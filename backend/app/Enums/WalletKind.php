<?php

namespace App\Enums;

enum WalletKind: string
{
    case Cash = 'cash';
    case Bank = 'bank';
    case EWallet = 'e_wallet';
}
