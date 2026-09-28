<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Transaksi</title>
    <style>
        @page { margin: 28px 28px 40px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #212529; }
        h1 { font-size: 16px; margin: 0 0 2px; }
        .muted { color: #6c757d; }
        .meta { margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        .summary td { border: 1px solid #dee2e6; padding: 6px 8px; width: 25%; }
        .summary .label { font-size: 8px; color: #6c757d; }
        .summary .value { font-size: 11px; font-weight: bold; }
        .list { margin-top: 12px; }
        .list th { background: #e9ecef; text-align: left; padding: 5px 4px; border-bottom: 1px solid #ced4da; }
        .list td { padding: 4px; border-bottom: 1px solid #eef0f2; vertical-align: top; }
        .list tr:nth-child(even) td { background: #fafbfc; }
        .right, .list th.right { text-align: right; }
        .nowrap { white-space: nowrap; }
        .income { color: #198754; }
        .expense { color: #dc3545; }
        .footer { position: fixed; bottom: -24px; left: 0; right: 0; font-size: 8px; color: #6c757d; }
    </style>
</head>
<body>
@php
    $rp = fn ($n) => ($n < 0 ? '-' : '').'Rp '.number_format(abs($n), (fmod(abs($n), 1) > 0 ? 2 : 0), ',', '.');
    $tgl = fn ($d) => $d->translatedFormat('j M Y');
@endphp

<h1>Laporan Transaksi</h1>
<div class="meta muted">
    {{ $user->name }} &middot;
    @if ($period)
        {{ $tgl($period->start) }} &ndash; {{ $tgl($period->end) }}
    @else
        Semua tanggal
    @endif
    @if ($filterSummary)
        &middot; {{ implode(' · ', $filterSummary) }}
    @endif
</div>

<table class="summary">
    <tr>
        <td><div class="label">Pemasukan</div><div class="value income">{{ $rp($totals['income']) }}</div></td>
        <td><div class="label">Pengeluaran</div><div class="value expense">{{ $rp($totals['expense']) }}</div></td>
        <td><div class="label">Saldo</div><div class="value {{ $totals['balance'] < 0 ? 'expense' : 'income' }}">{{ $rp($totals['balance']) }}</div></td>
        <td><div class="label">Jumlah transaksi</div><div class="value">{{ number_format($totals['count'], 0, ',', '.') }}</div></td>
    </tr>
</table>

<table class="list">
    <thead>
    <tr>
        <th style="width: 62px">Tanggal</th>
        <th>Deskripsi</th>
        <th style="width: 90px">Kategori</th>
        <th style="width: 58px">Metode</th>
        <th class="right" style="width: 92px">Nominal</th>
    </tr>
    </thead>
    <tbody>
    @forelse ($transactions as $trx)
        <tr>
            <td class="nowrap">{{ $tgl($trx->transaction_date) }}</td>
            <td>
                {{ $trx->description ?: $trx->category?->name }}
                @if ($trx->notes)
                    <div class="muted">{{ \Illuminate\Support\Str::limit($trx->notes, 120) }}</div>
                @endif
            </td>
            <td>{{ $trx->category?->name }}</td>
            <td>{{ $trx->payment_method->label() }}</td>
            <td class="right nowrap {{ $trx->type->value }}">
                {{ $trx->type->value === 'income' ? '+' : '-' }}{{ $rp((float) $trx->amount) }}
            </td>
        </tr>
    @empty
        <tr><td colspan="5" class="muted" style="text-align:center; padding: 16px">Tidak ada transaksi.</td></tr>
    @endforelse
    </tbody>
</table>

<div class="footer">Dibuat {{ $generatedAt->translatedFormat('j F Y H:i') }} · Pidu-App</div>
</body>
</html>
