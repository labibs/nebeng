<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        'https://numpak.vercel.app',
        'https://numpak-admin.vercel.app',
        'https://numpak-landing.sakte.id',
        'https://numpak.sakte.id',
    ],
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9-]+\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
