<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deal extends Model
{
    protected $guarded = [];

    protected $casts = [
        'pickup_datetime' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'item_photos' => 'array',
        'item_fee' => 'decimal:2',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function carrier()
    {
        return $this->belongsTo(User::class, 'carrier_id', 'clerk_id');
    }

    public function depositor()
    {
        return $this->belongsTo(User::class, 'depositor_id', 'clerk_id');
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }

    public function liveLocation()
    {
        return $this->hasOne(DealLiveLocation::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
