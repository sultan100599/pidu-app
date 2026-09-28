<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base FormRequest API: pesan validasi Bahasa Indonesia untuk rule yang dipakai.
 */
abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return [
            'required' => ':Attribute wajib diisi.',
            'required_with' => ':Attribute wajib diisi bersama :values.',
            'string' => ':Attribute harus berupa teks.',
            'integer' => ':Attribute harus berupa bilangan bulat.',
            'numeric' => ':Attribute harus berupa angka.',
            'boolean' => ':Attribute harus bernilai benar atau salah.',
            'email' => ':Attribute harus berupa alamat email yang valid.',
            'date_format' => ':Attribute harus berformat :format.',
            'after_or_equal' => ':Attribute harus sama dengan atau setelah :date.',
            // Aturan ukuran: Laravel mencari kunci 'max' (bukan 'max.string') dan memilih
            // pesan berdasarkan tipe atribut → wajib array berisi keempat tipe.
            'max' => [
                'string' => ':Attribute maksimal :max karakter.',
                'numeric' => ':Attribute maksimal :max.',
                'array' => ':Attribute maksimal :max item.',
                'file' => ':Attribute maksimal :max kilobyte.',
            ],
            'min' => [
                'string' => ':Attribute minimal :min karakter.',
                'numeric' => ':Attribute minimal :min.',
                'array' => ':Attribute minimal :min item.',
                'file' => ':Attribute minimal :min kilobyte.',
            ],
            'between' => [
                'string' => ':Attribute harus antara :min dan :max karakter.',
                'numeric' => ':Attribute harus antara :min dan :max.',
                'array' => ':Attribute harus berisi :min sampai :max item.',
                'file' => ':Attribute harus antara :min dan :max kilobyte.',
            ],
            'gt' => [
                'string' => ':Attribute harus lebih dari :value karakter.',
                'numeric' => ':Attribute harus lebih dari :value.',
                'array' => ':Attribute harus lebih dari :value item.',
                'file' => ':Attribute harus lebih dari :value kilobyte.',
            ],
            'decimal' => ':Attribute maksimal 2 angka di belakang koma.',
            'in' => ':Attribute tidak valid.',
            'enum' => ':Attribute tidak valid.',
            'exists' => ':Attribute tidak valid.',
            'unique' => ':Attribute sudah digunakan.',
            'confirmed' => 'Konfirmasi :attribute tidak cocok.',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama',
            'email' => 'email',
            'password' => 'password',
            'transaction_date' => 'tanggal',
            'type' => 'jenis',
            'category_id' => 'kategori',
            'amount' => 'nominal',
            'payment_method' => 'metode pembayaran',
            'description' => 'deskripsi',
            'notes' => 'catatan',
            'start_date' => 'tanggal mulai',
            'end_date' => 'tanggal akhir',
            'year' => 'tahun',
            'month' => 'bulan',
            'icon' => 'ikon',
            'color' => 'warna',
            'per_page' => 'jumlah per halaman',
            'sort' => 'urutan',
            'dir' => 'arah urutan',
        ];
    }
}
