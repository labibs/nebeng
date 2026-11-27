<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TitipRequest extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'destination_lat' => 'decimal:7',
        'destination_lng' => 'decimal:7',
        'offered_fee' => 'decimal:2',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_clerk_id', 'clerk_id');
    }

    public function warung()
    {
        return $this->belongsTo(Warung::class);
    }

    public function order()
    {
        return $this->hasOne(TitipOrder::class);
    }
}
