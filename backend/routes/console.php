<?php

use App\Services\SupabaseMysqlImporter;
use Illuminate\Support\Facades\Artisan;

Artisan::command('supabase:import {--truncate : Empty target tables before importing} {--tables=* : Optional list of tables to import}', function () {
    $tables = array_filter((array) $this->option('tables'));
    $truncate = (bool) $this->option('truncate');

    $summary = app(SupabaseMysqlImporter::class)->import($truncate, $tables);

    foreach ($summary as $table => $count) {
        $this->info("Imported {$count} rows into {$table}");
    }
})->purpose('Import Supabase public tables into the MySQL database');
