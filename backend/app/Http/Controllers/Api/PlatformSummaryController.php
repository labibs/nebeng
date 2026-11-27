<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\Post;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warung;
use App\Models\WarungProduct;
use Illuminate\Support\Facades\Cache;

class PlatformSummaryController extends Controller
{
    public function show()
    {
        $summary = Cache::remember('public-platform-summary-v1', now()->addMinutes(5), fn () => [
            'users' => User::query()->count(),
            'posts' => Post::query()->count(),
            'transactionsCount' => Transaction::query()->count(),
            'revenue' => (float) Transaction::query()->sum('gross_amount'),
            'dealsCount' => Deal::query()->count(),
            'outletsCount' => Warung::query()->count(),
            'productsCount' => WarungProduct::query()->count(),
            'updatedAt' => now()->toIso8601String(),
        ]);

        return response()->json($summary)
            ->header('Cache-Control', 'public, max-age=300');
    }
}
