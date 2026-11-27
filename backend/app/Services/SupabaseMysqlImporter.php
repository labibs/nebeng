<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class SupabaseMysqlImporter
{
    private array $tableOrder = [
        'users',
        'posts',
        'warungs',
        'carrier_trips',
        'conversations',
        'deals',
        'deal_live_locations',
        'titip_requests',
        'titip_orders',
        'categories',
        'warung_products',
        'warung_experiences',
        'reviews',
        'warung_cart_items',
        'messages',
        'transactions',
        'post_comments',
        'conversation_participants',
    ];

    private array $tableOrders = [
        'users' => 'id',
        'posts' => 'id',
        'warungs' => 'id',
        'carrier_trips' => 'id',
        'conversations' => 'id',
        'deals' => 'id',
        'deal_live_locations' => 'deal_id',
        'titip_requests' => 'id',
        'titip_orders' => 'id',
        'categories' => 'id',
        'warung_products' => 'id',
        'warung_experiences' => 'id',
        'reviews' => 'id',
        'warung_cart_items' => 'id',
        'messages' => 'id',
        'transactions' => 'id',
        'post_comments' => 'id',
        'conversation_participants' => 'conversation_id',
    ];

    public function import(bool $truncate = false, array $tables = []): array
    {
        $this->assertConfigured();

        $selected = $tables
            ? array_values(array_intersect($this->tableOrder, $tables))
            : $this->tableOrder;

        if (empty($selected)) {
            throw new RuntimeException('No matching tables selected for import.');
        }

        $summary = [];

        if ($truncate) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            try {
                foreach (array_reverse($selected) as $table) {
                    DB::table($table)->truncate();
                }
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }
        }

        foreach ($selected as $table) {
            $rows = $this->fetchTable($table);
            $payload = array_map(fn (array $row) => $this->normalizeRow($table, $row), $rows);

            foreach (array_chunk($payload, 500) as $chunk) {
                if (!empty($chunk)) {
                    DB::table($table)->insert($chunk);
                }
            }

            $summary[$table] = count($payload);
        }

        return $summary;
    }

    private function assertConfigured(): void
    {
        if (!config('services.supabase.url') || !config('services.supabase.service_role_key')) {
            throw new RuntimeException('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
        }
    }

    private function fetchTable(string $table): array
    {
        $baseUrl = rtrim((string) config('services.supabase.url'), '/');
        $limit = 1000;
        $offset = 0;
        $all = [];
        $orderColumn = $this->tableOrders[$table] ?? 'created_at';

        while (true) {
            $response = Http::withHeaders([
                'apikey' => config('services.supabase.service_role_key'),
                'Authorization' => 'Bearer '.config('services.supabase.service_role_key'),
            ])->get($baseUrl.'/rest/v1/'.$table, [
                'select' => '*',
                'order' => $orderColumn.'.asc',
                'limit' => $limit,
                'offset' => $offset,
            ]);

            if (!$response->successful()) {
                throw new RuntimeException("Failed to fetch {$table} from Supabase: ".$response->body());
            }

            $rows = $response->json();

            if (!is_array($rows) || $rows === []) {
                break;
            }

            $all = array_merge($all, $rows);

            if (count($rows) < $limit) {
                break;
            }

            $offset += $limit;
        }

        return $all;
    }

    private function normalizeRow(string $table, array $row): array
    {
        $columns = array_flip(Schema::getColumnListing($table));
        $data = array_intersect_key($row, $columns);

        foreach ($data as $key => $value) {
            if ($value === null) {
                continue;
            }

            if ($this->isJsonColumn($key, $table)) {
                $data[$key] = is_string($value)
                    ? $value
                    : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                continue;
            }

            if ($this->isDateTimeColumn($key)) {
                $data[$key] = Carbon::parse($value)->utc()->format('Y-m-d H:i:s');
                continue;
            }
        }

        return $data;
    }

    private function isJsonColumn(string $column, string $table): bool
    {
        return in_array($column, [
            'location',
            'item_photos',
        ], true);
    }

    private function isDateTimeColumn(string $column): bool
    {
        return in_array($column, [
            'created_at',
            'updated_at',
            'travel_date',
            'pickup_datetime',
            'paid_at',
        ], true);
    }
}
