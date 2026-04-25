<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAssistantController extends Controller
{
    public function assist(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'form_data' => 'nullable|array'
        ]);

        $apiKey = config('services.groq.key');

        if (!$apiKey) {
            return response()->json(['message' => 'AI Assistant is currently unavailable (API key missing).'], 503);
        }

        $userMessage = $request->input('message');
        $formData = $request->input('form_data', []);

        // Format the form data into a readable string if provided
        $contextString = "";
        if (!empty($formData)) {
            $contextString = "Current Form Data context:\n";
            foreach ($formData as $key => $value) {
                if (is_string($value) || is_numeric($value)) {
                    $contextString .= "- {$key}: {$value}\n";
                }
            }
            $contextString .= "\nUser's Request: ";
        }

        $fullPrompt = $contextString . $userMessage;

        // Groq uses the OpenAI-compatible chat completions format
        $payload = [
            "model"    => "llama-3.3-70b-versatile",
            "messages" => [
                [
                    "role"    => "system",
                    "content" => "You are a highly skilled and knowledgeable School Senior Maintenance Officer. You assist users with the General Service Office (GSO) maintenance request form. You MUST strictly limit your responses to school maintenance, GSO topics, and assessing maintenance request forms. If a user asks about anything unrelated to school maintenance or GSO, politely refuse to answer. Assess the provided form details, suggest improvements for clarity to help maintenance staff understand the issue better, and answer facility maintenance questions directly (e.g., why an AC unit stops working, basic troubleshooting, or expected repair procedures). Provide concise, professional, and helpful responses."
                ],
                [
                    "role"    => "user",
                    "content" => $fullPrompt
                ]
            ],
            "temperature" => 0.7,
            "max_tokens"  => 512,
        ];

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $apiKey,
            ])->post('https://api.groq.com/openai/v1/chat/completions', $payload);

            if ($response->successful()) {
                $data = $response->json();

                // Groq response follows OpenAI format: choices[0].message.content
                if (isset($data['choices'][0]['message']['content'])) {
                    $reply = $data['choices'][0]['message']['content'];
                    return response()->json([
                        'reply' => $reply
                    ]);
                }

                return response()->json(['message' => 'Failed to parse AI response.'], 500);
            }

            Log::error('Groq API Error: ' . $response->body());
            return response()->json(['message' => 'AI service error. Please try again later.'], 502);

        } catch (\Exception $e) {
            Log::error('Groq API Exception: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred while contacting the AI.'], 500);
        }
    }
}

