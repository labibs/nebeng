<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasUuids;

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'is_read' => 'boolean',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function deal()
    {
        return $this->belongsTo(Deal::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id', 'clerk_id');
    }
}
