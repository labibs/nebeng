<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function warung()
    {
        return $this->belongsTo(Warung::class);
    }

    public function products()
    {
        return $this->hasMany(WarungProduct::class);
    }
}
