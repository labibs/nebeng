<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DealLiveLocation extends Model
{
    protected $table = 'deal_live_locations';

    protected $primaryKey = 'deal_id';

    public $incrementing = false;

    public $timestamps = true;

    public const CREATED_AT = null;
    public const UPDATED_AT = 'updated_at';

    protected $guarded = [];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'updated_at' => 'datetime',
    ];

    public function deal()
    {
        return $this->belongsTo(Deal::class);
    }

    public function courier()
    {
        return $this->belongsTo(User::class, 'courier_id', 'clerk_id');
    }
}
