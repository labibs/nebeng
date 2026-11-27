<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $guarded = [];

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'travel_date' => 'datetime',
        'from_lat' => 'decimal:7',
        'from_lng' => 'decimal:7',
        'to_lat' => 'decimal:7',
        'to_lng' => 'decimal:7',
        'price' => 'decimal:2',
        'fee' => 'decimal:2',
        'location' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function deals()
    {
        return $this->hasMany(Deal::class);
    }

    public function comments()
    {
        return $this->hasMany(PostComment::class);
    }

    public function likes()
    {
        return $this->hasMany(PostLike::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
