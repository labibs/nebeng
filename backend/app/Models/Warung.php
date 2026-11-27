<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Warung extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'from_lat' => 'decimal:7',
        'from_lng' => 'decimal:7',
        'to_lat' => 'decimal:7',
        'to_lng' => 'decimal:7',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_clerk_id', 'clerk_id');
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(WarungProduct::class);
    }

    public function experiences()
    {
        return $this->hasMany(WarungExperience::class);
    }

    public function cartItems()
    {
        return $this->hasMany(WarungCartItem::class);
    }

    public function titipRequests()
    {
        return $this->hasMany(TitipRequest::class);
    }
}
