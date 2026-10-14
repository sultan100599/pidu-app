<?php

namespace App\Enums;

use Carbon\CarbonImmutable;

enum Frequency: string
{
    case Monthly = 'monthly';
    case Weekly = 'weekly';

    /**
     * Jadwal ke-$n (0 = start). Bulanan tanpa overflow: 31 Jan → 28/29 Feb → 31 Mar.
     */
    public function occurrence(CarbonImmutable $start, int $n): CarbonImmutable
    {
        return match ($this) {
            self::Monthly => $start->addMonthsNoOverflow($n),
            self::Weekly => $start->addWeeks($n),
        };
    }
}
