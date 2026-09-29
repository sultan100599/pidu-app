<?php

// Snapshot pesan server untuk mengganti bahasa error/toast yang sudah tampil.
$root = dirname(__DIR__);
$flatten = function (array $values, string $prefix = '') use (&$flatten): array {
    $out = [];
    foreach ($values as $key => $value) {
        $path = $prefix.$key;
        if (is_array($value)) {
            $out += $flatten($value, $path.'.');
        } else {
            $out[$path] = preg_replace_callback('/:([A-Za-z_]+)/', fn ($m) => '{'.strtolower($m[1]).'}', $value);
        }
    }
    return $out;
};
$catalogs = [];
foreach (['id', 'en', 'su'] as $locale) {
    $catalogs[$locale] = $flatten(require "$root/lang/$locale/messages.php", 'messages.')
        + $flatten(require "$root/lang/$locale/validation.php", 'validation.');
}
$rows = [];
foreach ($catalogs['id'] as $key => $value) {
    $row = array_map(fn ($locale) => $catalogs[$locale][$key], ['id', 'en', 'su']);
    $rows[] = $row;
    if (str_starts_with($key, 'validation.attributes.')) {
        $rows[] = array_map(fn ($text) => ucfirst($text), $row);
    }
}
$json = json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).PHP_EOL;
$target = dirname($root).'/frontend/src/i18n/server.json';
if (in_array('--check', $argv, true)) {
    if (!is_file($target) || str_replace("\r\n", "\n", file_get_contents($target)) !== str_replace("\r\n", "\n", $json)) {
        fwrite(STDERR, "Server locale snapshot is stale. Run php backend/scripts/frontend-locales.php\n");
        exit(1);
    }
    echo "Server locale snapshot matches all three PHP catalogs.\n";
} else {
    file_put_contents($target, $json);
}
