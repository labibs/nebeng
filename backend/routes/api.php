<?php

use App\Http\Controllers\Api\BrowseController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AiPostAssistantController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PostCommentController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\PostLikeController;
use App\Http\Controllers\Api\PlatformSummaryController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WarungController;
use App\Http\Controllers\Api\WarungProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\Webhook\ClerkWebhookController;
use App\Http\Controllers\Webhook\MidtransWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'numpak-backend',
    ]);
});

Route::post('/webhooks/clerk', [ClerkWebhookController::class, 'store']);
Route::post('/webhooks/midtrans', [MidtransWebhookController::class, 'store']);
Route::get('/platform/summary', [PlatformSummaryController::class, 'show']);

Route::middleware('clerk.user')->group(function () {

    Route::post('/ai/post-assistant', [AiPostAssistantController::class, 'chat']);

    // --- Admin dashboard/API (role verified server-side) ---
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/posts', [AdminController::class, 'posts']);
    Route::get('/admin/warungs', [AdminController::class, 'warungs']);
    Route::get('/admin/transactions', [AdminController::class, 'transactions']);
    Route::get('/admin/unread-count', [AdminController::class, 'unreadCount']);
    Route::get('/admin/conversations', [AdminController::class, 'conversations']);
    Route::get('/admin/conversations/{conversationId}/messages', [AdminController::class, 'conversationMessages']);
    Route::post('/admin/conversations/{conversationId}/messages', [AdminController::class, 'sendConversationMessage']);
    Route::get('/admin/notifications', [AdminController::class, 'notifications']);

    // --- Transactions ---
    Route::post('/transactions/create-snap', [TransactionController::class, 'createSnap']);
    Route::post('/transactions/pay', [TransactionController::class, 'createSnap']);
    Route::get('/transactions', [BrowseController::class, 'getTransactions']);

    // --- Users / Profile ---
    Route::post('/users/sync', [BrowseController::class, 'syncUser']);
    Route::get('/users', [BrowseController::class, 'listUsers']);
    Route::get('/users/admins', [ProfileController::class, 'admins']);
    Route::get('/users/profile', [ProfileController::class, 'show']);
    Route::get('/users/{clerkId}', [ProfileController::class, 'showByClerkId']);

    // --- Posts ---
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{id}', [PostController::class, 'show']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);

    // --- Post Likes ---
    Route::get('/posts/{postId}/likes', [PostLikeController::class, 'index']);
    Route::post('/posts/{postId}/likes', [PostLikeController::class, 'toggle']);

    // --- Post Comments ---
    Route::get('/posts/{postId}/comments', [PostCommentController::class, 'index']);
    Route::post('/posts/{postId}/comments', [PostCommentController::class, 'store']);
    Route::delete('/comments/{id}', [PostCommentController::class, 'destroy']);

    // --- Warungs ---
    Route::get('/warungs', [WarungController::class, 'index']);
    Route::get('/warungs/count', [WarungController::class, 'count']);
    Route::get('/warungs/{id}', [WarungController::class, 'show']);
    Route::post('/warungs', [WarungController::class, 'store']);
    Route::put('/warungs/{id}', [WarungController::class, 'update']);
    Route::delete('/warungs/{id}', [WarungController::class, 'destroy']);

    // --- Warung Products ---
    Route::get('/products', [WarungProductController::class, 'index']);
    Route::post('/products', [WarungProductController::class, 'store']);
    Route::put('/products/{id}', [WarungProductController::class, 'update']);
    Route::delete('/products/{id}', [WarungProductController::class, 'destroy']);

    // --- Categories ---
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- Conversations ---
    Route::get('/conversations', [BrowseController::class, 'listConversations']);
    Route::post('/conversations', [BrowseController::class, 'startConversation']);

    // --- Messages ---
    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'indexByConversation']);
    Route::get('/conversations/{conversationId}/messages/new', [MessageController::class, 'newMessages']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::post('/messages/read', [MessageController::class, 'markRead']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);

    // --- Cart ---
    Route::get('/cart', [BrowseController::class, 'getCart']);
    Route::delete('/cart', [BrowseController::class, 'deleteCartItems']);
    Route::patch('/cart/{id}/quantity', [BrowseController::class, 'updateCartQuantity']);
    Route::delete('/cart/{id}', [BrowseController::class, 'deleteCartItem']);
    Route::post('/cart/deal', [BrowseController::class, 'dealCart']);

    // --- Market ---
    Route::get('/market/products', [BrowseController::class, 'getMarketProducts']);

    // --- Deals ---
    Route::get('/deals/{id}', [DealController::class, 'show']);
    Route::put('/deals/{id}', [DealController::class, 'update']);
    Route::get('/deals/post/{postId}/info', [BrowseController::class, 'getDealPostInfo']);
    Route::get('/deals/post/{postId}', [BrowseController::class, 'getDealByPost']);
    Route::post('/deals/from-post', [BrowseController::class, 'createDealFromPost']);
    Route::get('/deals/{dealId}/messages', [BrowseController::class, 'getDealMessages']);

    // --- Deal Live Location ---
    Route::get('/deals/{dealId}/live-location', [DealController::class, 'getLiveLocation']);
    Route::post('/deals/{dealId}/live-location', [DealController::class, 'updateLiveLocation']);

    // --- Deal Transaction ---
    Route::get('/deals/{dealId}/transaction', [DealController::class, 'getTransaction']);
    Route::put('/deals/{dealId}/transaction', [DealController::class, 'upsertTransaction']);
    Route::put('/transactions/{id}', [DealController::class, 'updateTransaction']);

    // --- Reviews ---
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);
});
