<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TitipOrder extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'final_price' => 'decimal:2',
        'carrier_fee' => 'decimal:2',
        'platform_fee' => 'decimal:2',
    ];

    public function request()
    {
        return $this->belongsTo(TitipRequest::class, 'titip_request_id');
    }

    public function carrier()
    {
        return $this->belongsTo(User::class, 'carrier_clerk_id', 'clerk_id');
    }
}
