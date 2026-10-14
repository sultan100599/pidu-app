<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;

/**
 * Filter export = filter daftar transaksi (search, type, category_id, payment_method,
 * periode, sort, dir). Tanpa periode → semua tanggal.
 */
class ExportRequest extends TransactionIndexRequest
{
    /**
     * Deskripsi filter aktif untuk header PDF, mis. ["Jenis: Pengeluaran", "Cari: \"makan\""].
     *
     * @return list<string>
     */
    public function filterSummary(): array
    {
        $filters = $this->filters();
        $out = [];

        if (isset($filters['type'])) {
            $out[] = 'Jenis: '.TransactionType::from($filters['type'])->label('id');
        }
        if (isset($filters['category_id'])) {
            $out[] = 'Kategori: '.$this->user()->categories()->whereKey($filters['category_id'])->value('name');
        }
        if (isset($filters['payment_method'])) {
            $out[] = 'Metode: '.PaymentMethod::from($filters['payment_method'])->label('id');
        }
        if (isset($filters['wallet_id'])) {
            $out[] = 'Dompet: '.$this->user()->wallets()->whereKey($filters['wallet_id'])->value('name');
        }
        if (isset($filters['purpose'])) {
            $out[] = 'Dompet: '.($filters['purpose'] === 'business' ? 'Usaha' : 'Pribadi');
        }
        if (isset($filters['search'])) {
            $out[] = 'Cari: "'.$filters['search'].'"';
        }

        return $out;
    }
}
