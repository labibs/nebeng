<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Post;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warung;
use App\Models\WarungCartItem;
use App\Models\WarungProduct;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrowseController extends Controller
{
    private const REQUEST_POST_TYPES = [
        'nitip_bawakan',
        'nitip_belikan',
        'cari_boncengan',
        'tukang',
    ];

    private function clerkId(Request $request): string
    {
        $clerkId = (string) (
            $request->attributes->get('clerk_user_id')
            ?? $request->header('x-clerk-user-id')
            ?? $request->header('x-user-id')
            ?? $request->input('clerk_id')
            ?? ''
        );
        abort_if($clerkId === '', 401, 'User not authenticated');

        return $clerkId;
    }

    private function inferDealParticipants(Post $post, string $clerkId): array
    {
        $ownerId = (string) ($post->clerk_user_id ?? '');
        abort_if($ownerId === '', 422, 'Post owner is missing');

        $requesterPost = in_array($post->type, self::REQUEST_POST_TYPES, true);

        return $requesterPost
            ? [
                'carrier_id' => $clerkId,
                'depositor_id' => $ownerId,
            ]
            : [
                'carrier_id' => $ownerId,
                'depositor_id' => $clerkId,
            ];
    }

    private function dealDefaultsFromPost(Post $post): array
    {
        $location = is_array($post->location) ? $post->location : [];
        $fromLabel = $post->from_city ?: ($location['address'] ?? 'Lokasi Asal');
        $toLabel = $post->to_city ?: ($location['address'] ?? 'Lokasi Tujuan');

        return [
            'agreed_fee' => (float) ($post->fee ?? 0),
            'item_fee' => (float) ($post->price ?? 0),
            'status' => 'pending',
            'pickup_location' => $post->from_lat !== null && $post->from_lng !== null
                ? $post->from_lat . ',' . $post->from_lng . ', ' . $fromLabel
                : $fromLabel,
            'delivery_location' => $post->to_lat !== null && $post->to_lng !== null
                ? $post->to_lat . ',' . $post->to_lng . ', ' . $toLabel
                : $toLabel,
            'pickup_datetime' => $post->travel_date ?? now(),
            'item_description' => $post->item_description ?: ($post->description ?: 'TBD'),
            'item_photos' => $post->item_photo ? [$post->item_photo] : [],
            'notes' => $post->description ?: '',
            'delivery_status' => 'draft',
        ];
    }

    private function dealPayloadFromRequest(Request $request, Post $post, string $clerkId): array
    {
        $participants = $this->inferDealParticipants($post, $clerkId);
        $defaults = $this->dealDefaultsFromPost($post);
        $pickupDatetime = $request->input('pickup_datetime');
        $itemPhotos = $request->input('item_photos');

        return [
            'post_id' => $post->id,
            ...$participants,
            'agreed_fee' => $request->filled('agreed_fee') ? $request->input('agreed_fee') : $defaults['agreed_fee'],
            'item_fee' => $request->filled('item_fee') ? $request->input('item_fee') : $defaults['item_fee'],
            'status' => $request->input('status', $defaults['status']),
            'pickup_location' => $request->input('pickup_location', $defaults['pickup_location']),
            'delivery_location' => $request->input('delivery_location', $defaults['delivery_location']),
            'pickup_datetime' => $pickupDatetime ?: $defaults['pickup_datetime'],
            'item_description' => $request->input('item_description', $defaults['item_description']),
            'item_photos' => array_values(array_filter((array) (
                $itemPhotos
                ?? ($request->filled('item_photo') ? [$request->input('item_photo')] : $defaults['item_photos'])
            ))),
            'notes' => $request->input('notes', $defaults['notes']),
            'delivery_status' => $request->input('delivery_status', $defaults['delivery_status']),
        ];
    }

    public function syncUser(Request $request)
    {
        $clerkId = $this->clerkId($request);
        $payload = [
            'clerk_id' => $clerkId,
            'name' => $request->input('name', 'User'),
            'avatar_url' => $request->input('avatar_url'),
        ];

        User::query()->updateOrCreate(['clerk_id' => $clerkId], $payload);

        return response()->json(['message' => 'User synced']);
    }

    public function listUsers(Request $request)
    {
        $clerkId = $this->clerkId($request);

        return response()->json(
            User::query()
                ->select('id', 'name', 'avatar_url', 'clerk_id')
                ->where('clerk_id', '!=', $clerkId)
                ->orderBy('name')
                ->get()
        );
    }

    public function startConversation(Request $request)
    {
        $clerkId = $this->clerkId($request);
        $opponentId = (string) $request->input('opponent_id', '');
        abort_if($opponentId === '', 422, 'opponent_id is required');

        $myConvIds = ConversationParticipant::query()
            ->where('user_id', $clerkId)
            ->pluck('conversation_id');

        if ($myConvIds->isNotEmpty()) {
            $shared = ConversationParticipant::query()
                ->where('user_id', $opponentId)
                ->whereIn('conversation_id', $myConvIds)
                ->first();

            if ($shared) {
                return response()->json(['conversation_id' => $shared->conversation_id]);
            }
        }

        $conversation = Conversation::query()->create([]);
        ConversationParticipant::query()->insert([
            ['conversation_id' => $conversation->id, 'user_id' => $clerkId],
            ['conversation_id' => $conversation->id, 'user_id' => $opponentId],
        ]);

        return response()->json(['conversation_id' => $conversation->id]);
    }

    public function listConversations(Request $request)
    {
        $clerkId = $this->clerkId($request);
        $search = strtolower(trim((string) $request->query('search', '')));

        $myConvIds = ConversationParticipant::query()
            ->where('user_id', $clerkId)
            ->pluck('conversation_id');

        if ($myConvIds->isEmpty()) {
            return response()->json([]);
        }

        $messages = Message::query()
            ->whereIn('conversation_id', $myConvIds)
            ->orderByDesc('created_at')
            ->get(['id', 'conversation_id', 'content', 'created_at', 'sender_id', 'is_read']);

        $participants = ConversationParticipant::query()
            ->whereIn('conversation_id', $myConvIds)
            ->get(['conversation_id', 'user_id']);

        $opponentIds = $participants
            ->where('user_id', '!=', $clerkId)
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->values();

        $opponentMap = User::query()
            ->whereIn('clerk_id', $opponentIds)
            ->get(['clerk_id', 'name', 'avatar_url'])
            ->keyBy('clerk_id');

        $lastMessageMap = [];
        $unreadCountMap = [];
        foreach ($messages as $message) {
            $convId = (string) $message->conversation_id;
            if (!isset($lastMessageMap[$convId])) {
                $lastMessageMap[$convId] = $message;
            }
            if ($message->sender_id !== $clerkId && !$message->is_read) {
                $unreadCountMap[$convId] = ($unreadCountMap[$convId] ?? 0) + 1;
            }
        }

        $opponentByConversation = [];
        foreach ($participants as $participant) {
            if ($participant->user_id !== $clerkId && !isset($opponentByConversation[(string) $participant->conversation_id])) {
                $opponentByConversation[(string) $participant->conversation_id] = $participant->user_id;
            }
        }

        $result = [];
        foreach ($myConvIds as $conversationId) {
            $conversationId = (string) $conversationId;
            $opponentClerkId = $opponentByConversation[$conversationId] ?? null;
            $opponent = $opponentMap->get($opponentClerkId) ?? (object) ['name' => 'Unknown', 'avatar_url' => '/default-avatar.png'];
            $lastMessage = $lastMessageMap[$conversationId] ?? null;

            $item = [
                'conversationId' => $conversationId,
                'opponent' => $opponent,
                'lastMessage' => $lastMessage?->content ?? 'Belum ada pesan',
                'lastTime' => $lastMessage?->created_at ?? '',
                'unreadCount' => $unreadCountMap[$conversationId] ?? 0,
            ];

            if ($search !== '') {
                $name = strtolower((string) data_get($item, 'opponent.name', ''));
                $content = strtolower((string) ($item['lastMessage'] ?? ''));
                if (!str_contains($name, $search) && !str_contains($content, $search)) {
                    continue;
                }
            }

            $result[] = $item;
        }

        usort($result, fn ($a, $b) => strcmp((string) ($b['lastTime'] ?? ''), (string) ($a['lastTime'] ?? '')));

        return response()->json($result);
    }

    public function getCart(Request $request)
    {
        $clerkId = $this->clerkId($request);

        $buyerItems = WarungCartItem::query()
            ->with([
                'product:id,name,image_url,estimated_price',
                'warung.creator:id,clerk_id,name,avatar_url',
            ])
            ->where('user_id', $clerkId)
            ->where('status', 'pending')
            ->get();

        $warungIds = Warung::query()
            ->where('created_by_clerk_id', $clerkId)
            ->pluck('id');

        $ownerItems = collect();
        if ($warungIds->isNotEmpty()) {
            $ownerItems = WarungCartItem::query()
                ->with([
                    'product:id,name,image_url,estimated_price',
                    'warung.creator:id,clerk_id,name,avatar_url',
                ])
                ->whereIn('warung_id', $warungIds)
                ->where('status', 'pending')
                ->where('user_id', '!=', $clerkId)
                ->get();
        }

        $items = $buyerItems->concat($ownerItems)->values();
        $buyerIds = $items->pluck('user_id')->filter()->unique()->values();
        $buyers = User::query()
            ->whereIn('clerk_id', $buyerIds)
            ->get(['clerk_id', 'name', 'avatar_url'])
            ->keyBy('clerk_id');

        return response()->json($items->map(function (WarungCartItem $item) use ($buyers) {
            return [
                'id' => $item->id,
                'user_id' => $item->user_id,
                'quantity' => $item->quantity,
                'requested_price' => $item->requested_price,
                'estimated_price' => $item->estimated_price,
                'notes' => $item->notes,
                'status' => $item->status,
                'product' => $item->product,
                'warung' => $item->warung ? [
                    'id' => $item->warung->id,
                    'name' => $item->warung->name,
                    'address' => $item->warung->address,
                    'latitude' => $item->warung->latitude,
                    'longitude' => $item->warung->longitude,
                    'category' => $item->warung->category,
                    'status' => $item->warung->status,
                    'created_by_clerk_id' => $item->warung->created_by_clerk_id,
                    'owner' => $item->warung->creator,
                ] : null,
                'buyer' => $buyers->get($item->user_id),
            ];
        }));
    }

    public function updateCartQuantity(Request $request, string $id)
    {
        $quantity = (int) $request->input('quantity');
        abort_if($quantity < 1, 422, 'Invalid quantity');

        WarungCartItem::query()->where('id', $id)->update(['quantity' => $quantity]);

        return response()->json(['message' => 'Quantity updated']);
    }

    public function deleteCartItem(string $id)
    {
        WarungCartItem::query()->where('id', $id)->delete();
        return response()->json(['message' => 'Item deleted']);
    }

    public function deleteCartItems(Request $request)
    {
        $ids = array_values(array_filter((array) $request->input('ids', [])));
        abort_if(empty($ids), 422, 'Invalid IDs');

        WarungCartItem::query()->whereIn('id', $ids)->delete();

        return response()->json(['message' => count($ids).' items deleted']);
    }

    public function dealCart(Request $request)
    {
        $clerkId = $this->clerkId($request);
        $itemIds = array_values(array_filter((array) $request->input('item_ids', [])));
        $opponentId = (string) $request->input('opponent_id', '');
        $dealId = null;

        abort_if(empty($itemIds), 422, 'item_ids are required');
        abort_if($opponentId === '', 422, 'opponent_id is required');

        DB::transaction(function () use ($request, $clerkId, $itemIds, $opponentId, &$dealId): void {
            WarungCartItem::query()->whereIn('id', $itemIds)->update(['status' => 'accepted']);

            $existing = Deal::query()
                ->when($request->filled('post_id'), fn (Builder $q) => $q->where('post_id', $request->input('post_id')))
                ->when(!$request->filled('post_id'), fn (Builder $q) => $q->where('item_description', (string) $request->input('item_description', '')))
                ->where('carrier_id', $request->input('carrier_id', $clerkId))
                ->where('depositor_id', $request->input('depositor_id', $opponentId))
                ->orderByDesc('created_at')
                ->first();

            $payload = [
                'post_id' => $request->input('post_id'),
                'carrier_id' => $request->input('carrier_id', $clerkId),
                'depositor_id' => $request->input('depositor_id', $opponentId),
                'pickup_location' => $request->input('pickup_location', ''),
                'delivery_location' => $request->input('delivery_location', ''),
                'item_description' => $request->input('item_description', ''),
                'item_photos' => array_values(array_filter((array) (
                    $request->input('item_photos')
                    ?? ($request->filled('item_photo') ? [$request->input('item_photo')] : [])
                ))),
                'item_fee' => $request->input('total_item_price', 0),
                'agreed_fee' => ((float) $request->input('agreed_fee', 0)) > 0
                    ? $request->input('agreed_fee')
                    : $request->input('total_payment', $request->input('proposed_fee', 0)),
                'notes' => $request->input('notes', ''),
                'pickup_datetime' => $request->input('pickup_datetime', now()),
                'status' => $request->input('status', 'completed'),
                'delivery_status' => $request->input('delivery_status', 'draft'),
            ];

            if ($existing) {
                $existing->update($payload);
                $dealId = $existing->id;
            } else {
                $deal = Deal::query()->create($payload);
                $dealId = $deal->id;
            }
        });

        $conversation = $this->startConversation($request->merge(['opponent_id' => $opponentId]))->getData(true);

        return response()->json([
            'conversation_id' => $conversation['conversation_id'],
            'deal_id' => $dealId ?? null,
        ]);
    }

    public function createDealFromPost(Request $request)
    {
        $clerkId = $this->clerkId($request);
        $postId = (string) $request->input('post_id', '');
        abort_if($postId === '', 422, 'post_id is required');

        $post = Post::query()
            ->select(
                'id',
                'type',
                'fee',
                'price',
                'item_description',
                'item_photo',
                'from_lat',
                'from_lng',
                'to_lat',
                'to_lng',
                'from_city',
                'to_city',
                'travel_date',
                'description',
                'location',
                'clerk_user_id',
            )
            ->findOrFail($postId);

        abort_if($post->clerk_user_id === $clerkId, 403, 'Cannot create deal from your own post');

        $payload = $this->dealPayloadFromRequest($request, $post, $clerkId);
        $messageId = (string) $request->input('message_id', '');

        $deal = DB::transaction(function () use ($payload, $messageId) {
            $existing = Deal::query()
                ->where('post_id', $payload['post_id'])
                ->where('carrier_id', $payload['carrier_id'])
                ->where('depositor_id', $payload['depositor_id'])
                ->latest('created_at')
                ->first();

            if ($existing) {
                if ($messageId !== '') {
                    Message::query()
                        ->where('id', $messageId)
                        ->update(['deal_id' => $existing->id]);
                }

                return $existing;
            }

            $deal = Deal::query()->create($payload);

            if ($messageId !== '') {
                Message::query()
                    ->where('id', $messageId)
                    ->update(['deal_id' => $deal->id]);
            }

            return $deal;
        });

        return response()->json($deal);
    }

    public function getMarketProducts(Request $request)
    {
        $query = WarungProduct::query()
            ->with([
                'category:id,name',
                'warung.creator:id,clerk_id,name,avatar_url',
            ])
            ->orderByDesc('created_at')
            ->limit(20);

        if ($request->filled('category')) {
            $query->whereHas('warung', fn (Builder $q) => $q->where('category', $request->input('category')));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->input('search').'%');
        }

        $rows = $query->get()->map(function (WarungProduct $product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'estimated_price' => $product->estimated_price,
                'image_url' => $product->image_url,
                'rating' => $product->rating,
                'is_estimated' => $product->is_estimated,
                'created_at' => $product->created_at,
                'category_name' => $product->category?->name,
                'warung_name' => $product->warung?->name,
                'warung_status' => $product->warung?->status,
                'owner_id' => $product->warung?->created_by_clerk_id,
                'owner_name' => $product->warung?->creator?->name,
                'owner_avatar' => $product->warung?->creator?->avatar_url,
            ];
        });

        return response()->json($rows);
    }

    public function getTransactions(Request $request)
    {
        $clerkId = $this->clerkId($request);

        $deals = Deal::query()
            ->with([
                'post:id,from_city,to_city,type,item_photo,created_at',
                'carrier:id,clerk_id,name,avatar_url',
                'depositor:id,clerk_id,name,avatar_url',
                'transaction:id,deal_id,transaction_status,payment_status,gross_amount,payment_type,created_at',
            ])
            ->where('carrier_id', $clerkId)
            ->orWhere('depositor_id', $clerkId)
            ->get();

        $rows = [];
        foreach ($deals as $deal) {
            $dealSummary = [
                'id' => $deal->id,
                'item_description' => $deal->item_description,
                'item_photos' => $deal->item_photos,
                'status' => $deal->status,
                'agreed_fee' => $deal->agreed_fee,
                'item_fee' => $deal->item_fee,
                'pickup_location' => $deal->pickup_location,
                'delivery_location' => $deal->delivery_location,
                'pickup_datetime' => $deal->pickup_datetime,
                'carrier_id' => $deal->carrier_id,
                'depositor_id' => $deal->depositor_id,
                'post' => $deal->post,
                'carrier' => $deal->carrier,
                'depositor' => $deal->depositor,
            ];

            $transactions = $deal->relationLoaded('transaction') && $deal->transaction
                ? [$deal->transaction]
                : [];

            foreach ($transactions as $transaction) {
                $rows[] = [
                    ...$transaction->toArray(),
                    'deal' => $dealSummary,
                ];
            }
        }

        usort($rows, fn ($a, $b) => strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? '')));

        return response()->json($rows);
    }

    public function getDealPostInfo(Request $request, string $postId)
    {
        $post = Post::query()->select('id', 'type', 'from_city', 'to_city', 'travel_date', 'item_description', 'fee', 'item_photo')->findOrFail($postId);
        return response()->json($post);
    }

    public function getDealByPost(Request $request, string $postId)
    {
        $message = Message::query()
            ->where('post_id', $postId)
            ->whereNotNull('deal_id')
            ->orderByDesc('created_at')
            ->first();

        $deal = $message?->deal_id
            ? Deal::query()
                ->select('id', 'agreed_fee', 'item_fee', 'pickup_location', 'delivery_location', 'pickup_datetime', 'item_description', 'status', 'delivery_status')
                ->find($message->deal_id)
            : null;

        if (!$deal) {
            $deal = Deal::query()
                ->select('id', 'agreed_fee', 'item_fee', 'pickup_location', 'delivery_location', 'pickup_datetime', 'item_description', 'status', 'delivery_status')
                ->where('post_id', $postId)
                ->latest('created_at')
                ->first();
        }

        abort_if(!$deal, 404, 'No deal found for this post');

        return response()->json($deal);
    }

    public function getDealMessages(Request $request, string $dealId)
    {
        $messages = Message::query()
            ->select('message_type', 'deal_id', 'content', 'from_city', 'to_city', 'fee', 'travel_date', 'item_description')
            ->where('deal_id', $dealId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($messages);
    }
}
