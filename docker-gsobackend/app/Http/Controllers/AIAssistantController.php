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
            'message'   => 'required|string|max:1000',
            'form_data' => 'nullable|array',
            'mode'      => 'nullable|string|in:general,improve_description',
        ]);

        $apiKey = config('services.groq.key');

        if (!$apiKey) {
            return response()->json(['message' => 'AI Assistant is currently unavailable (API key missing).'], 503);
        }

        $userMessage = $request->input('message');
        $formData    = $request->input('form_data', []);
        $mode        = $request->input('mode', 'general');

        // --- Build context string from form data ---
        $contextString = "";
        if (!empty($formData)) {
            $contextString = "Current Maintenance Request Form Data:\n";
            foreach ($formData as $key => $value) {
                if (is_string($value) || is_numeric($value)) {
                    $contextString .= "- {$key}: {$value}\n";
                }
            }
            $contextString .= "\nUser's Message: ";
        }

        $fullPrompt = $contextString . $userMessage;

        // --- Select system prompt based on mode ---
        if ($mode === 'improve_description') {
            $systemPrompt = "You are a professional technical writer for the General Service Office (GSO) of Jose Rizal Memorial State University. "
                . "Your only job is to rewrite and improve the 'details' / description field of a maintenance request form based on the user's verbal explanation and the current form context provided. "
                . "The improved description must be: formal, clear, concise, written in third-person or passive voice, and structured to help maintenance staff immediately understand the issue, its location, when it happened, and any actions already taken. "
                . "Do NOT include greetings, commentary, suggestions, or any conversational text in your output. "
                . "Format your response EXACTLY as follows — include the delimiters literally:\n\n"
                . "---DESCRIPTION---\n"
                . "{The improved description text here. Plain paragraph(s), no bullet points, no markdown.}\n"
                . "---END---\n\n"
                . "After the closing delimiter, you may add 1-2 short sentences of optional advice for the user if relevant. "
                . "If the user's input does not relate to a maintenance request at all, respond with: 'Please describe a maintenance issue so I can help improve your request.'";
        } else {
            $systemPrompt = "You are a highly skilled and knowledgeable School Senior Maintenance Officer. "
                . "You assist users with the General Service Office (GSO) maintenance request form. "
                . "You MUST strictly limit your responses to school maintenance, GSO topics, and assessing maintenance request forms. "
                . "If a user asks about anything unrelated to school maintenance or GSO, politely refuse to answer. "
                . "Assess the provided form details, suggest improvements for clarity to help maintenance staff understand the issue better, "
                . "and answer facility maintenance questions directly (e.g., why an AC unit stops working, basic troubleshooting, or expected repair procedures). "
                . "Provide concise, professional, and helpful responses.";
        }

        // --- Build Groq payload ---
        $payload = [
            "model"       => "llama-3.3-70b-versatile",
            "messages"    => [
                [
                    "role"    => "system",
                    "content" => $systemPrompt,
                ],
                [
                    "role"    => "user",
                    "content" => $fullPrompt,
                ],
            ],
            "temperature" => 0.5,
            "max_tokens"  => 512,
        ];

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $apiKey,
            ])->post('https://api.groq.com/openai/v1/chat/completions', $payload);

            if ($response->successful()) {
                $data = $response->json();

                if (!isset($data['choices'][0]['message']['content'])) {
                    return response()->json(['message' => 'Failed to parse AI response.'], 500);
                }

                $reply = $data['choices'][0]['message']['content'];

                // --- Extract improved description if in improve_description mode ---
                if ($mode === 'improve_description') {
                    $improvedDescription = null;

                    if (preg_match('/---DESCRIPTION---\s*(.*?)\s*---END---/s', $reply, $matches)) {
                        $improvedDescription = trim($matches[1]);
                    }

                    return response()->json([
                        'reply'                => $reply,
                        'improved_description' => $improvedDescription,
                    ]);
                }

                return response()->json(['reply' => $reply]);
            }

            Log::error('Groq API Error: ' . $response->body());
            return response()->json(['message' => 'AI service error. Please try again later.'], 502);

        } catch (\Exception $e) {
            Log::error('Groq API Exception: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred while contacting the AI.'], 500);
        }
    }
}

