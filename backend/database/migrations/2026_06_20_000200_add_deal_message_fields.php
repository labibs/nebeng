<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->text('from_city')->nullable()->after('content');
            $table->text('to_city')->nullable()->after('from_city');
            $table->decimal('fee', 12, 2)->nullable()->after('to_city');
            $table->timestampTz('travel_date')->nullable()->after('fee');
            $table->text('item_description')->nullable()->after('travel_date');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['from_city', 'to_city', 'fee', 'travel_date', 'item_description']);
        });
    }
};
