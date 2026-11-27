<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiPostAssistantController extends Controller
{
    private const POST_TYPES = [
        'nitip_bawakan', 'nitip_belikan', 'cari_boncengan',
        'tukang', 'perjalanan', 'keliling', 'content',
    ];

    public function chat(Request $request)
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:30'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:2000'],
            'draft' => ['nullable', 'array'],
        ]);

        $apiKey = config('services.openai.api_key');
        if (!$apiKey) {
            return response()->json(['message' => 'Asisten AI belum dikonfigurasi. Admin perlu mengisi OPENAI_API_KEY di environment backend.'], 503);
        }

        $systemPrompt = <<<'PROMPT'
Kamu adalah asisten yang membantu pengguna Numpak membuat satu postingan. Percakapan harus santai, ramah, ringkas, dan berbahasa Indonesia.
Kumpulkan informasi dengan bertanya satu per satu. Jangan mengarang informasi atau menandai draft siap jika ada data wajib yang belum disebutkan. Bila pengguna menyampaikan beberapa informasi sekaligus, simpan semuanya. Jika maksudnya belum jelas, tanyakan jenis postingan.
Jenis yang valid:
- nitip_bawakan: pengguna sudah punya barang dan mencari orang untuk membawakannya; wajib item_description, from_city, to_city, price (perkiraan harga barang, angka rupiah), fee (ongkos, angka rupiah).
- nitip_belikan: pengguna minta dibelikan barang; wajib item_description, to_city, price (perkiraan harga barang), fee (ongkos).
- cari_boncengan: mencari tumpangan; wajib from_city, to_city, travel_date.
- tukang: mencari tukang/layanan; wajib description dan location.
- perjalanan: menawarkan perjalanan dan menerima titipan/boncengan; wajib from_city, to_city, travel_date.
- keliling: jualan keliling; wajib description dan location.
- content: konten video; wajib description (caption) dan location. Jangan meminta unggahan video.
Balas HANYA JSON valid dengan bentuk {"reply":"pesan untuk pengguna","post":{"type":null,"item_description":null,"from_city":null,"to_city":null,"travel_date":null,"price":null,"fee":null,"description":null,"location":null,"armada":null},"ready":false}.
Harga harus berupa integer rupiah. Tanggal simpan sebagai ISO 8601. Jika pengguna hanya menyebut tanggal tanpa jam, tanyakan jam keberangkatan. Lokasi simpan sebagai nama/alamat teks. Armada boleh motor atau mobil jika disebutkan; selain itu null. Ketika semua data wajib sudah ada, rangkum secara singkat di reply dan set ready true. Jangan membuat postingan atau mengklaim sudah dipublikasikan.
PROMPT;

        $messages = [['role' => 'system', 'content' => $systemPrompt]];
        $draft = $validated['draft'] ?? [];
        if ($draft) {
            $messages[] = ['role' => 'system', 'content' => 'Draft sementara yang sudah terkumpul (pertahankan kecuali pengguna mengoreksi): ' . json_encode($draft, JSON_UNESCAPED_UNICODE)];
        }
        foreach ($validated['messages'] as $message) {
            $messages[] = $message;
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(40)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'response_format' => ['type' => 'json_object'],
                    'messages' => $messages,
                    'temperature' => 0.3,
                ]);
        } catch (\Throwable $exception) {
            Log::warning('AI post assistant request failed', ['error' => $exception->getMessage()]);
            return response()->json(['message' => 'Asisten sedang sulit dihubungi. Coba lagi sebentar.'], 502);
        }

        if (!$response->successful()) {
            Log::warning('AI post assistant returned an error', ['status' => $response->status()]);
            return response()->json(['message' => 'Asisten sedang bermasalah. Coba lagi sebentar.'], 502);
        }

        $content = $response->json('choices.0.message.content');
        $result = is_string($content) ? json_decode($content, true) : null;
        if (!is_array($result) || !is_array($result['post'] ?? null) || !is_string($result['reply'] ?? null)) {
            return response()->json(['message' => 'Jawaban asisten tidak dapat diproses. Coba kirim pesan lagi.'], 502);
        }

        $post = array_intersect_key($result['post'], array_flip([
            'type', 'item_description', 'from_city', 'to_city', 'travel_date',
            'price', 'fee', 'description', 'location', 'armada',
        ]));

        if (!in_array($post['type'] ?? null, self::POST_TYPES, true)) {
            $post['type'] = null;
        }
        foreach ($post as $key => $value) {
            if (is_string($value)) {
                $post[$key] = trim($value) ?: null;
            }
        }

        $required = match ($post['type'] ?? null) {
            'nitip_bawakan' => ['item_description', 'from_city', 'to_city', 'price', 'fee'],
            'nitip_belikan' => ['item_description', 'to_city', 'price', 'fee'],
            'cari_boncengan', 'perjalanan' => ['from_city', 'to_city', 'travel_date'],
            'tukang', 'keliling', 'content' => ['description', 'location'],
            default => ['type'],
        };
        $ready = ($result['ready'] ?? false) === true
            && collect($required)->every(fn ($key) => isset($post[$key]) && $post[$key] !== '');

        foreach (['price', 'fee'] as $key) {
            if (isset($post[$key])) {
                $post[$key] = (int) preg_replace('/\D+/', '', (string) $post[$key]);
            }
        }

        return response()->json([
            'reply' => $result['reply'],
            'post' => $post,
            'ready' => $ready,
        ]);
    }
}
