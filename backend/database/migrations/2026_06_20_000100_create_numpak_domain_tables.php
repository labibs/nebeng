<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('armada')->default('motor');
            $table->decimal('from_lat', 10, 7)->nullable();
            $table->decimal('from_lng', 10, 7)->nullable();
            $table->decimal('to_lat', 10, 7)->nullable();
            $table->decimal('to_lng', 10, 7)->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->string('type')->default('');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('travel_date')->nullable();
            $table->text('from_city')->nullable();
            $table->text('to_city')->nullable();
            $table->text('item_description')->nullable();
            $table->text('item_photo')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('fee', 12, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('status')->nullable();
            $table->json('location')->nullable();
            $table->string('clerk_user_id')->nullable();
        });

        Schema::create('warungs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('created_by_clerk_id')->nullable();
            $table->text('name');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('visibility')->default('private');
            $table->timestampTz('created_at')->useCurrent();
            $table->text('category')->nullable();
            $table->string('status')->nullable();
            $table->text('image_url')->nullable();
            $table->text('dokumen_url')->nullable();
            $table->text('address')->nullable();
            $table->decimal('from_lat', 10, 7)->nullable();
            $table->decimal('from_lng', 10, 7)->nullable();
            $table->decimal('to_lat', 10, 7)->nullable();
            $table->decimal('to_lng', 10, 7)->nullable();

            $table->foreign('created_by_clerk_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('carrier_trips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('carrier_clerk_id')->nullable();
            $table->decimal('start_lat', 10, 7)->nullable();
            $table->decimal('start_lng', 10, 7)->nullable();
            $table->decimal('end_lat', 10, 7)->nullable();
            $table->decimal('end_lng', 10, 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign('carrier_clerk_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->timestampTz('created_at')->nullable()->useCurrent();
        });

        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_status')->default('draft');
            $table->foreignId('post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->string('carrier_id');
            $table->string('depositor_id');
            $table->integer('agreed_fee');
            $table->timestampTz('pickup_datetime')->nullable();
            $table->string('status')->default('pending');
            $table->string('pickup_location')->default('TBD');
            $table->string('delivery_location')->default('TBD');
            $table->string('item_description')->default('TBD');
            $table->json('item_photos')->nullable();
            $table->string('notes')->default('');
            $table->timestampTz('created_at')->nullable()->useCurrent();
            $table->timestampTz('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
            $table->decimal('item_fee', 12, 2)->default(0);

            $table->foreign('carrier_id')->references('clerk_id')->on('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreign('depositor_id')->references('clerk_id')->on('users')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::create('deal_live_locations', function (Blueprint $table) {
            $table->foreignId('deal_id')->primary()->constrained('deals')->cascadeOnDelete();
            $table->string('courier_id');
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->timestampTz('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();

            $table->foreign('courier_id')->references('clerk_id')->on('users')->restrictOnDelete();
        });

        Schema::create('titip_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('buyer_clerk_id')->nullable();
            $table->foreignUuid('warung_id')->nullable()->constrained('warungs')->nullOnDelete();
            $table->text('custom_warung_name')->nullable();
            $table->text('custom_warung_note')->nullable();
            $table->decimal('destination_lat', 10, 7)->nullable();
            $table->decimal('destination_lng', 10, 7)->nullable();
            $table->decimal('offered_fee', 12, 2)->nullable();
            $table->string('status')->default('searching');
            $table->timestampTz('created_at')->nullable()->useCurrent();

            $table->foreign('buyer_clerk_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('titip_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('titip_request_id')->nullable()->constrained('titip_requests')->nullOnDelete();
            $table->string('carrier_clerk_id')->nullable();
            $table->decimal('final_price', 12, 2)->nullable();
            $table->decimal('carrier_fee', 12, 2)->nullable();
            $table->decimal('platform_fee', 12, 2)->nullable();
            $table->string('status')->nullable();
            $table->timestampTz('created_at')->nullable()->useCurrent();

            $table->foreign('carrier_clerk_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('warung_id')->constrained('warungs')->cascadeOnDelete();
            $table->text('name');
            $table->text('description')->nullable();
            $table->timestampTz('created_at')->nullable()->useCurrent();
            $table->text('icon')->nullable();
        });

        Schema::create('warung_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('warung_id')->constrained('warungs')->cascadeOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->text('name');
            $table->decimal('estimated_price', 12, 2)->nullable();
            $table->text('image_url')->nullable();
            $table->string('created_by_clerk_id')->nullable();
            $table->decimal('rating', 4, 2)->default(0);
            $table->boolean('is_estimated')->default(true);
            $table->timestampTz('created_at')->nullable()->useCurrent();

            $table->foreign('created_by_clerk_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('warung_experiences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('warung_id')->nullable()->constrained('warungs')->nullOnDelete();
            $table->string('user_clerk_id')->nullable();
            $table->text('note')->nullable();
            $table->boolean('success')->nullable();
            $table->timestampTz('created_at')->nullable()->useCurrent();

            $table->foreign('user_clerk_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reviewable_type');
            $table->uuid('reviewable_id')->nullable();
            $table->string('reviewable_clerk_id')->nullable();
            $table->string('user_clerk_id');
            $table->decimal('rating', 4, 2);
            $table->text('comment')->nullable();
            $table->timestampTz('created_at')->nullable()->useCurrent();

            $table->foreign('user_clerk_id')->references('clerk_id')->on('users')->cascadeOnDelete();
        });

        Schema::create('warung_cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('user_id');
            $table->foreignUuid('warung_id')->constrained('warungs')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('warung_products')->cascadeOnDelete();
            $table->decimal('requested_price', 12, 2)->nullable();
            $table->decimal('estimated_price', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('status')->default('pending');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('user_id')->references('clerk_id')->on('users')->cascadeOnDelete();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('message_type')->default('text');
            $table->foreignId('post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->foreignId('deal_id')->nullable()->constrained('deals')->nullOnDelete();
            $table->timestampTz('created_at')->nullable()->useCurrent();
            $table->boolean('is_read')->default(false);
            $table->string('sender_id')->nullable();
            $table->foreignUuid('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->text('content');

            $table->foreign('sender_id')->references('clerk_id')->on('users')->nullOnDelete();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('deal_id')->unique()->constrained('deals')->cascadeOnDelete();
            $table->decimal('gross_amount', 12, 2);
            $table->string('payment_type')->nullable();
            $table->string('fraud_status')->nullable();
            $table->string('snap_token')->nullable();
            $table->timestampTz('paid_at')->nullable();
            $table->string('payment_gateway')->default('midtrans');
            $table->timestampTz('created_at')->nullable()->useCurrent();
            $table->timestampTz('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
            $table->string('order_id')->unique()->nullable();
            $table->string('transaction_status')->default('ready_to_ship');
            $table->string('payment_status')->default('pending');
        });

        Schema::create('post_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
            $table->string('user_id');
            $table->text('content');
            $table->timestampTz('created_at')->nullable()->useCurrent();

            $table->foreign('user_id')->references('clerk_id')->on('users')->cascadeOnDelete();
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->timestampTz('created_at')->nullable()->useCurrent();
            $table->string('user_id')->nullable();

            $table->foreign('user_id')->references('clerk_id')->on('users')->nullOnDelete();
            $table->index(['conversation_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('post_comments');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('warung_cart_items');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('warung_experiences');
        Schema::dropIfExists('warung_products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('titip_orders');
        Schema::dropIfExists('titip_requests');
        Schema::dropIfExists('deal_live_locations');
        Schema::dropIfExists('deals');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('carrier_trips');
        Schema::dropIfExists('warungs');
        Schema::dropIfExists('posts');
    }
};
