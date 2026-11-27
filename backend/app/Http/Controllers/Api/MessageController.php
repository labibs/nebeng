<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    private function clerkId(Request $request): string
    {
        return (string) ($request->attributes->get('clerk_user_id') ?? '');
    }

    public function indexByConversation(Request $request, string $conversationId)
    {
        $messages = Message::query()
            ->with(['sender:id,clerk_id,name,avatar_url'])
            ->where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $data = $request->only([
            'conversation_id', 'content', 'message_type',
            'post_id', 'deal_id',
            'from_city', 'to_city', 'fee', 'travel_date', 'item_description',
        ]);

        $data['sender_id'] = $clerkId;
        $data['created_at'] = now();

        $message = Message::query()->create($data);

        return response()->json($message, 201);
    }

    public function markRead(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $conversationId = $request->input('conversation_id');
        abort_if(!$conversationId, 422, 'conversation_id is required');

        Message::query()
            ->where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $clerkId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Messages marked as read']);
    }

    public function unreadCount(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $conversationIds = \App\Models\ConversationParticipant::query()
            ->where('user_id', $clerkId)
            ->pluck('conversation_id');

        if ($conversationIds->isEmpty()) {
            return response()->json(['count' => 0]);
        }

        $count = Message::query()
            ->whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $clerkId)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function newMessages(Request $request)
    {
        $clerkId = $this->clerkId($request);
        abort_if($clerkId === '', 401);

        $conversationId = $request->input('conversation_id');
        $after = $request->input('after');

        $query = Message::query()
            ->with(['sender:id,clerk_id,name,avatar_url'])
            ->where('conversation_id', $conversationId);

        if ($after) {
            $query->where('created_at', '>', $after);
        }

        return response()->json($query->orderBy('created_at')->get());
    }
}
