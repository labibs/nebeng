<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Post;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warung;
use App\Models\WarungProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    private function requireAdmin(Request $request): string
    {
        $clerkId = (string) ($request->attributes->get('clerk_user_id') ?? $request->header('x-clerk-user-id') ?? '');
        abort_if($clerkId === '', 401, 'User not authenticated');
        abort_unless(User::query()->where('clerk_id', $clerkId)->where('role', 'admin')->exists(), 403, 'Admin access required');

        return $clerkId;
    }

    public function users(Request $request)
    {
        $this->requireAdmin($request);
        return response()->json(User::query()->orderByDesc('created_at')->get());
    }

    public function posts(Request $request)
    {
        $this->requireAdmin($request);
        return response()->json(Post::query()->with(['user:id,clerk_id,name,avatar_url'])->orderByDesc('created_at')->get()
            ->map(fn (Post $post) => [...$post->toArray(), 'users' => $post->user]));
    }

    public function warungs(Request $request)
    {
        $this->requireAdmin($request);
        return response()->json(Warung::query()->with([
            'creator:id,clerk_id,name,avatar_url,role',
            'products',
        ])->orderByDesc('created_at')->get()->map(fn (Warung $warung) => [
            ...$warung->toArray(),
            'owner' => $warung->creator,
        ]));
    }

    public function transactions(Request $request)
    {
        $this->requireAdmin($request);
        $transactions = Transaction::query()->with([
            'deal:id,depositor_id,carrier_id,post_id',
            'deal.depositor:id,clerk_id,name,avatar_url',
            'deal.carrier:id,clerk_id,name,avatar_url',
        ])->orderByDesc('created_at')->get();
        $deals = Deal::query()->with([
            'post:id,item_photo,from_city,to_city',
            'depositor:id,clerk_id,name,avatar_url',
            'carrier:id,clerk_id,name,avatar_url',
            'transaction',
        ])->orderByDesc('created_at')->get();

        $transactions = $transactions->map(fn (Transaction $transaction) => [
            ...$transaction->toArray(),
            'deals' => $transaction->deal,
        ]);
        return response()->json(['transactions' => $transactions, 'deals' => $deals]);
    }

    public function dashboard(Request $request)
    {
        $this->requireAdmin($request);
        $transactions = Transaction::query()->with('deal.depositor:id,clerk_id,name,avatar_url')->orderByDesc('created_at')->get();
        $outlets = Warung::query()->with('creator:id,clerk_id,name,avatar_url')->get();
        $owners = $outlets->pluck('creator')->filter()->unique('clerk_id')->values();

        return response()->json([
            'users' => User::query()->count(),
            'posts' => Post::query()->count(),
            'transactionsCount' => $transactions->count(),
            'revenue' => (float) $transactions->sum(fn ($transaction) => (float) $transaction->gross_amount),
            'dealsCount' => Deal::query()->count(),
            'outletsCount' => $outlets->count(),
            'productsCount' => WarungProduct::query()->count(),
            'ownersCount' => $owners->count(),
            'recentTransfers' => $transactions->take(5)->map(fn (Transaction $transaction) => [
                ...$transaction->toArray(),
                'deals' => $transaction->deal,
            ])->values(),
            'recentOwners' => $owners->take(5)->pluck('avatar_url')->values(),
            'recentDeals' => Deal::query()->with(['post:id,item_photo', 'depositor:id,clerk_id,name'])->orderByDesc('created_at')->limit(5)->get(),
        ]);
    }

    public function unreadCount(Request $request)
    {
        $clerkId = $this->requireAdmin($request);
        $conversationIds = ConversationParticipant::query()->where('user_id', $clerkId)->pluck('conversation_id');
        $count = $conversationIds->isEmpty() ? 0 : Message::query()->whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $clerkId)->where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    public function conversations(Request $request)
    {
        $clerkId = $this->requireAdmin($request);
        $conversations = Conversation::query()
            ->whereHas('participants', fn ($query) => $query->where('user_id', $clerkId))
            ->with(['participants.user:id,clerk_id,name,avatar_url,role', 'messages' => fn ($query) => $query->orderByDesc('created_at')])
            ->get();
        $items = $conversations->map(function (Conversation $conversation) {
            $messages = $conversation->messages;
            $last = $messages->first();
            $opponent = $conversation->participants->firstWhere('user.role', '!=', 'admin')?->user;
            return [
                'conversationId' => $conversation->id,
                'opponent' => $opponent ?? ['name' => 'Pengguna', 'avatar_url' => null],
                'lastMessage' => $last?->content ?? 'Belum ada pesan',
                'lastTime' => $last?->created_at ?? '',
                'unreadCount' => $messages->where('sender_id', '!=', $this->currentAdminId($conversation))->where('is_read', false)->count(),
            ];
        })->sortByDesc('lastTime')->values();
        return response()->json($items);
    }

    private function currentAdminId(Conversation $conversation): ?string
    {
        return $conversation->participants->firstWhere('user.role', 'admin')?->user_id;
    }

    public function conversationMessages(Request $request, string $conversationId)
    {
        $clerkId = $this->requireAdmin($request);
        $messages = Message::query()->with('sender:id,clerk_id,name,avatar_url')->where('conversation_id', $conversationId)->orderBy('created_at')->get();
        Message::query()->where('conversation_id', $conversationId)->where('sender_id', '!=', $clerkId)->where('is_read', false)->update(['is_read' => true]);
        return response()->json($messages);
    }

    public function sendConversationMessage(Request $request, string $conversationId)
    {
        $clerkId = $this->requireAdmin($request);
        $request->validate(['content' => ['required', 'string', 'max:10000']]);
        $message = Message::query()->create([
            'conversation_id' => $conversationId,
            'sender_id' => $clerkId,
            'content' => $request->input('content'),
            'created_at' => now(),
        ]);
        return response()->json($message, 201);
    }

    public function notifications(Request $request)
    {
        $this->requireAdmin($request);
        $after = Carbon::parse($request->query('after', now()->subSeconds(30)));
        $deals = Deal::query()->with('depositor:id,clerk_id,name')->where('created_at', '>', $after)->orderBy('created_at')->get()
            ->map(fn (Deal $deal) => ['id' => 'deal-'.$deal->id, 'type' => 'deal', 'title' => 'Deal Baru', 'message' => ($deal->depositor?->name ?? 'Seseorang').' baru saja membuat deal: '.$deal->item_description, 'time' => $deal->created_at]);
        $transactions = Transaction::query()->where('created_at', '>', $after)->orderBy('created_at')->get()
            ->map(fn (Transaction $transaction) => ['id' => 'trx-'.$transaction->id, 'type' => 'transaction', 'title' => 'Transaksi Baru', 'message' => 'Pembayaran baru masuk sebesar Rp'.number_format((float) $transaction->gross_amount, 0, ',', '.'), 'time' => $transaction->created_at]);
        $settlements = Transaction::query()->where('transaction_status', 'settlement')->where('updated_at', '>', $after)->orderBy('updated_at')->get()
            ->map(fn (Transaction $transaction) => ['id' => 'transfer-'.$transaction->id.'-'.$transaction->updated_at?->timestamp, 'type' => 'transfer', 'title' => 'Transfer Berhasil', 'message' => 'Dana sebesar Rp'.number_format((float) $transaction->gross_amount, 0, ',', '.').' telah berhasil diselesaikan', 'time' => $transaction->updated_at]);
        return response()->json(['events' => $deals->concat($transactions)->concat($settlements)->sortBy('time')->values(), 'cursor' => now()->toISOString()]);
    }
}
