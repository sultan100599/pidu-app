<?php

namespace Database\Seeders;

use App\Models\Transaction;
use App\Models\User;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /** @var array<string, int> map nama kategori => id */
    private array $cat = [];

    /** @var array<int, array<string, mixed>> */
    private array $rows = [];

    private User $user;

    /**
     * Run the database seeds.
     *
     * Deterministik: mt_srand(42) supaya hasil seed selalu sama.
     */
    public function run(): void
    {
        mt_srand(42);

        $demo = User::where('email', 'demo@pidu.test')->firstOrFail();
        $this->user = $demo;
        $this->cat = $demo->categories()->get()->keyBy('name')->map(fn ($c) => $c->id)->all();

        if ($demo->transactions()->doesntExist()) {
            // 2024 & 2025: data ringan, 1 pemasukan + beberapa pengeluaran per bulan
            foreach ([2024, 2025] as $year) {
                for ($month = 1; $month <= 12; $month++) {
                    $this->seedLightMonth($year, $month);
                }
            }

            // Juni–September 2026: data realistis lengkap (sampai 2026-09-28)
            foreach ([6, 7, 8, 9] as $month) {
                $this->seedFullMonth(2026, $month);
            }
        }

        $other = User::where('email', 'other@pidu.test')->first();

        if ($other && $other->transactions()->doesntExist()) {
            $this->seedOtherUser($other);
        }
    }

    private function seedFullMonth(int $year, int $month): void
    {
        $lastDay = Carbon::create($year, $month, 1)->daysInMonth;

        if ($year === 2026 && $month === 9) {
            $lastDay = 28; // hari ini 2026-09-28
        }

        $d = fn (int $day) => sprintf('%04d-%02d-%02d', $year, $month, min($day, $lastDay));

        // --- Pemasukan ---
        $this->addIncome('Gaji', $d(25), 8500000, 'Gaji bulanan');

        if ($month === 7) {
            $this->addIncome('Bonus', $d(28), 1500000, 'Bonus kinerja');
        }

        if ($month === 9) {
            $this->addIncome('Bonus', $d(18), 2000000, 'Bonus proyek');
        }

        for ($i = 0, $n = mt_rand(1, 2); $i < $n; $i++) {
            $this->addIncome(
                'Freelance',
                $d(mt_rand(3, 27)),
                $this->money(500000, 2000000),
                $this->pick(['Proyek desain logo', 'Ngoding aplikasi kasir', 'Tulis artikel blog', 'Kerja lepas data entry'])
            );
        }

        // --- Tagihan bulanan ---
        $this->addExpense('Listrik', $d(5), $this->money(350000, 550000), 'Listrik PLN', 'transfer');
        $this->addExpense('Internet', $d(10), $this->money(250000, 350000), 'Internet rumah', 'transfer');
        $this->addExpense('Pulsa', $d(15), $this->money(50000, 150000), 'Pulsa & paket data', $this->pick(['e_wallet', 'qris']));
        $this->addExpense('Tagihan', $d(8), $this->money(300000, 700000), $this->pick(['BPJS Kesehatan', 'Cicilan barang elektronik', 'Iuran lingkungan']), 'transfer');

        // --- Rumah tangga & anak (2x/bulan) ---
        for ($i = 0; $i < 2; $i++) {
            $this->addExpense('Rumah Tangga', $d(mt_rand(1, $lastDay)), $this->money(50000, 200000), $this->pick(['Sabun & deterjen', 'Peralatan dapur', 'Kebersihan rumah']));
            $this->addExpense('Anak', $d(mt_rand(1, $lastDay)), $this->money(100000, 400000), $this->pick(['Kebutuhan anak', 'Uang sekolah anak', 'Mainan anak']));
        }

        // --- Hiburan (1–2x/bulan) ---
        for ($i = 0, $n = mt_rand(1, 2); $i < $n; $i++) {
            $this->addExpense('Hiburan', $d(mt_rand(1, $lastDay)), $this->money(50000, 300000), $this->pick(['Nonton bioskop', 'Nongkrong di cafe', 'Top up game']));
        }

        // --- Kesehatan (kadang-kadang) ---
        if (mt_rand(1, 100) <= 30) {
            $this->addExpense('Kesehatan', $d(mt_rand(1, $lastDay)), $this->money(50000, 500000), $this->pick(['Beli obat', 'Periksa ke klinik', 'Vitamin']));
        }

        // --- Perjalanan: liburan Agustus ---
        if ($month === 8) {
            $this->addExpense('Perjalanan', $d(20), $this->money(500000, 1500000), 'Liburan keluarga', 'credit_card');
        }

        // --- Belanja mingguan (tiap Sabtu) ---
        $date = Carbon::create($year, $month, 1);

        while ($date->month === $month) {
            if ($date->isSaturday() && $date->day <= $lastDay) {
                $this->addExpense('Belanja', $date->toDateString(), $this->money(150000, 600000), 'Belanja mingguan');
            }

            $date->addDay();
        }

        // --- Harian ---
        for ($day = 1; $day <= $lastDay; $day++) {
            $ds = $d($day);

            // Makanan 1–3x/hari
            for ($i = 0, $n = mt_rand(1, 3); $i < $n; $i++) {
                [$desc, $min, $max] = $this->pick([
                    ['Sarapan', 15000, 30000],
                    ['Makan siang', 20000, 50000],
                    ['Makan malam', 25000, 120000],
                    ['Kopi & camilan', 20000, 50000],
                ]);

                $this->addExpense('Makanan', $ds, $this->money($min, $max), $desc);
            }

            // Transportasi 0–2x/hari
            for ($i = 0, $n = mt_rand(0, 2); $i < $n; $i++) {
                [$desc, $min, $max] = $this->pick([
                    ['Bensin', 30000, 60000],
                    ['Ojek online', 15000, 40000],
                    ['Parkir', 5000, 20000],
                    ['KRL / bus', 6000, 20000],
                ]);

                $this->addExpense('Transportasi', $ds, $this->money($min, $max), $desc);
            }

            // Rokok ±50% hari
            if (mt_rand(0, 1) === 1) {
                $this->addExpense('Rokok', $ds, $this->money(25000, 35000), 'Rokok');
            }
        }

        $this->flush();
    }

    private function seedLightMonth(int $year, int $month): void
    {
        $lastDay = Carbon::create($year, $month, 1)->daysInMonth;
        $d = fn (int $day) => sprintf('%04d-%02d-%02d', $year, $month, min($day, $lastDay));

        $this->addIncome('Gaji', $d(25), 8500000, 'Gaji bulanan');

        $this->addExpense('Listrik', $d(5), $this->money(300000, 500000), 'Listrik PLN', 'transfer');
        $this->addExpense('Internet', $d(10), $this->money(250000, 350000), 'Internet rumah', 'transfer');
        $this->addExpense('Belanja', $d(mt_rand(1, $lastDay)), $this->money(200000, 500000), 'Belanja bulanan');

        for ($i = 0; $i < 3; $i++) {
            $this->addExpense('Makanan', $d(mt_rand(1, $lastDay)), $this->money(20000, 100000), $this->pick(['Makan siang', 'Makan malam', 'Sarapan']));
        }

        for ($i = 0; $i < 2; $i++) {
            $this->addExpense('Transportasi', $d(mt_rand(1, $lastDay)), $this->money(10000, 50000), $this->pick(['Bensin', 'Ojek online']));
        }

        $this->flush();
    }

    private function seedOtherUser(User $other): void
    {
        $previousUser = $this->user;
        $previousCat = $this->cat;
        $previousRows = $this->rows;

        $this->user = $other;
        $this->cat = $other->categories()->get()->keyBy('name')->map(fn ($c) => $c->id)->all();
        $this->rows = [];

        $this->addIncome('Gaji', '2026-09-25', 6000000, 'Gaji bulanan');
        $this->addExpense('Makanan', '2026-09-02', 35000, 'Makan siang');
        $this->addExpense('Makanan', '2026-09-05', 52000, 'Makan malam');
        $this->addExpense('Makanan', '2026-09-12', 48000, 'Makan siang');
        $this->addExpense('Transportasi', '2026-09-03', 25000, 'Ojek online');
        $this->addExpense('Transportasi', '2026-09-08', 40000, 'Bensin');
        $this->addExpense('Hiburan', '2026-09-14', 150000, 'Nonton bioskop');
        $this->addExpense('Pulsa', '2026-09-10', 50000, 'Pulsa & paket data', 'e_wallet');

        $this->flush();

        $this->user = $previousUser;
        $this->cat = $previousCat;
        $this->rows = $previousRows;
    }

    private function addIncome(string $category, string $date, int $amount, string $description): void
    {
        $this->rows[] = $this->makeRow($category, $date, $amount, $description, 'income', 'transfer');
    }

    private function addExpense(string $category, string $date, int $amount, string $description, ?string $method = null): void
    {
        $this->rows[] = $this->makeRow($category, $date, $amount, $description, 'expense', $method ?? $this->pick(['cash', 'e_wallet', 'qris', 'debit']));
    }

    private function makeRow(string $category, string $date, int $amount, string $description, string $type, string $method): array
    {
        $now = now();

        return [
            'user_id' => $this->user->id,
            'category_id' => $this->cat[$category],
            'wallet_id' => app(WalletService::class)->primaryFor($this->user)->id,
            'transaction_date' => $date,
            'type' => $type,
            'amount' => $amount,
            'payment_method' => $method,
            'description' => $description,
            'notes' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /**
     * Batch insert per chunk — bukan create satu-satu.
     */
    private function flush(): void
    {
        if ($this->rows === []) {
            return;
        }

        foreach (array_chunk($this->rows, 500) as $chunk) {
            Transaction::insert($chunk);
        }

        $this->rows = [];
    }

    /**
     * Nominal acak dibulatkan ke ribuan.
     */
    private function money(int $min, int $max): int
    {
        return mt_rand((int) ($min / 1000), (int) ($max / 1000)) * 1000;
    }

    private function pick(array $items): mixed
    {
        return $items[mt_rand(0, count($items) - 1)];
    }
}
