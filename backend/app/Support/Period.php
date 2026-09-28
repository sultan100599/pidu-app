<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;

/**
 * Rentang tanggal inklusif (start..end) yang dipakai dashboard, laporan, dan filter transaksi.
 */
class Period
{
    public const MONTHS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    public function __construct(
        public readonly CarbonImmutable $start,
        public readonly CarbonImmutable $end,
    ) {}

    /**
     * Resolusi prioritas: start_date+end_date → year+month → year → bulan berjalan.
     * Jika $nullWhenEmpty dan tidak ada input periode, kembalikan null (= semua tanggal).
     */
    public static function fromInput(array $input, bool $nullWhenEmpty = false): ?self
    {
        if (! empty($input['start_date']) && ! empty($input['end_date'])) {
            return new self(
                CarbonImmutable::createFromFormat('!Y-m-d', $input['start_date']),
                CarbonImmutable::createFromFormat('!Y-m-d', $input['end_date']),
            );
        }

        if (! empty($input['year']) && ! empty($input['month'])) {
            return self::month((int) $input['year'], (int) $input['month']);
        }

        if (! empty($input['year'])) {
            return self::year((int) $input['year']);
        }

        if ($nullWhenEmpty) {
            return null;
        }

        $today = CarbonImmutable::today();

        return self::month($today->year, $today->month);
    }

    public static function month(int $year, int $month): self
    {
        $start = CarbonImmutable::create($year, $month, 1)->startOfDay();

        return new self($start, $start->endOfMonth()->startOfDay());
    }

    public static function year(int $year): self
    {
        $start = CarbonImmutable::create($year, 1, 1)->startOfDay();

        return new self($start, $start->endOfYear()->startOfDay());
    }

    public function days(): int
    {
        return max(1, (int) $this->start->diffInDays($this->end) + 1);
    }

    public function startDate(): string
    {
        return $this->start->toDateString();
    }

    public function endDate(): string
    {
        return $this->end->toDateString();
    }

    /**
     * Semua tanggal (Y-m-d) dalam rentang, urut naik.
     *
     * @return list<string>
     */
    public function dates(): array
    {
        return array_map(
            fn ($d) => $d->toDateString(),
            iterator_to_array(CarbonPeriod::create($this->start, '1 day', $this->end))
        );
    }

    /**
     * Semua bulan (Y-m) dalam rentang, urut naik.
     *
     * @return list<string>
     */
    public function months(): array
    {
        $out = [];
        $cursor = $this->start->startOfMonth();

        while ($cursor->lte($this->end)) {
            $out[] = $cursor->format('Y-m');
            $cursor = $cursor->addMonth();
        }

        return $out;
    }

    public function toArray(): array
    {
        return [
            'start_date' => $this->startDate(),
            'end_date' => $this->endDate(),
            'days' => $this->days(),
        ];
    }
}
