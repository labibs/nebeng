<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WarungProduct extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'estimated_price' => 'decimal:2',
        'rating' => 'decimal:2',
        'is_estimated' => 'boolean',
    ];

    public function warung()
    {
        return $this->belongsTo(Warung::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_clerk_id', 'clerk_id');
    }
}
