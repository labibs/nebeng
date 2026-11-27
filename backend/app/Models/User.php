<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids, Notifiable;

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role',
        'avatar_url',
        'clerk_id',
        'email',
        'name',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function conversations()
    {
        return $this->hasMany(ConversationParticipant::class, 'user_id', 'clerk_id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id', 'clerk_id');
    }

    public function carrierDeals()
    {
        return $this->hasMany(Deal::class, 'carrier_id', 'clerk_id');
    }

    public function depositorDeals()
    {
        return $this->hasMany(Deal::class, 'depositor_id', 'clerk_id');
    }

    public function warungs()
    {
        return $this->hasMany(Warung::class, 'created_by_clerk_id', 'clerk_id');
    }

    public function carrierTrips()
    {
        return $this->hasMany(CarrierTrip::class, 'carrier_clerk_id', 'clerk_id');
    }

    public function titipRequests()
    {
        return $this->hasMany(TitipRequest::class, 'buyer_clerk_id', 'clerk_id');
    }

    public function titipOrders()
    {
        return $this->hasMany(TitipOrder::class, 'carrier_clerk_id', 'clerk_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'user_clerk_id', 'clerk_id');
    }

    public function cartItems()
    {
        return $this->hasMany(WarungCartItem::class, 'user_id', 'clerk_id');
    }

    public function comments()
    {
        return $this->hasMany(PostComment::class, 'user_id', 'clerk_id');
    }
}
