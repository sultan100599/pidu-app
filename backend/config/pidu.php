<?php

return [

    'backup' => [
        // Folder backup (di luar Git: storage/app/* di-ignore). Berisi data keuangan — jangan dibagikan.
        'path' => env('PIDU_BACKUP_PATH', storage_path('app'.DIRECTORY_SEPARATOR.'backups')),

        // Jumlah file terbaru yang disimpan per folder (per user & snapshot database).
        'keep' => (int) env('PIDU_BACKUP_KEEP', 14),

        // Jam backup otomatis harian (butuh scheduler: `php artisan schedule:work`, ikut `npm start`).
        'time' => env('PIDU_BACKUP_TIME', '23:00'),
    ],

];
