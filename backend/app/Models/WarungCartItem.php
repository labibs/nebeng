<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WarungCartItem extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'quantity' => 'integer',
        'requested_price' => 'decimal:2',
        'estimated_price' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'clerk_id');
    }

    public function warung()
    {
        return $this->belongsTo(Warung::class);
    }

    public function product()
    {
        return $this->belongsTo(WarungProduct::class, 'product_id');
    }
}
