# AI Assistant — Description Enhancement Feature

**Date:** 2026-05-02  
**Type:** Enhancement  
**Area:** `AIAssistantController.php`

---

## Overview

The AI assistant now supports a new `improve_description` mode. When a user verbally explains the details of their maintenance issue to the AI, it rewrites and improves the `details` field of the maintenance request into a formal, structured, professional paragraph — ready to submit.

The existing `general` mode (Q&A advisor) is unchanged and continues to work as before.

---

## How It Works

### User Flow
1. User fills in the form partially (maintenance type, location, rough description like "sparks").
2. User opens the AI Assistant, describes what happened verbally.
3. AI returns a **cleaned-up, formal description** of the incident.
4. Frontend displays an **"Apply to Form"** button.
5. User taps it — the `details` field is replaced with the AI-generated text.
6. User reviews and submits.

### Backend Logic
- A new `mode` field is accepted by `POST /api/ai-assist`.
- When `mode = 'improve_description'`, the system prompt switches to a **technical writer persona** focused on rewriting the maintenance request description.
- The AI is instructed to wrap its output in strict delimiters:
  ```
  ---DESCRIPTION---
  {improved description text}
  ---END---
  ```
- The backend extracts the text between the delimiters using a regex and returns it as a separate `improved_description` field in the response.
- Temperature reduced from `0.7` to `0.5` for more deterministic, consistent rewrites.

---

## API Reference

### Request
`POST /api/ai-assist` *(requires auth:sanctum)*

```json
{
  "message": "Sudden wire sparks were observed at 3PM near Lab A corridor. We shut off the circuit breaker immediately.",
  "mode": "improve_description",
  "form_data": {
    "maintenance_type": "Electrical",
    "location": "Lab A, 2nd Floor",
    "details": "sudden wire sparks"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | ✅ | User's verbal explanation of the incident |
| `mode` | string | ❌ | `"general"` (default) or `"improve_description"` |
| `form_data` | object | ❌ | Current form field values for context |

### Response (when `mode = improve_description`)

```json
{
  "reply": "---DESCRIPTION---\nOn [date], sudden electrical sparking was observed...\n---END---\n\nEnsure the circuit breaker remains off until inspection.",
  "improved_description": "On [date], sudden electrical sparking was observed near the power outlet in Lab A, 2nd Floor. As a precautionary measure, the circuit breaker was immediately shut off. The incident has been formally reported to the General Service Office for immediate electrical inspection and repair."
}
```

| Field | Description |
|---|---|
| `reply` | Full raw AI response (shown in chat bubble) |
| `improved_description` | Extracted clean description text (used by "Apply to Form" button). `null` if parsing fails. |

### Response (when `mode = general` or omitted)

```json
{
  "reply": "Your form looks good. Consider adding..."
}
```

---

## Files Changed

| File | Change |
|---|---|
| `app/Http/Controllers/AIAssistantController.php` | Added `mode` validation, dual system prompt logic, delimiter-based description extraction |

---

## Frontend Developer Prompt

Send this to your frontend developer to implement the UI side:

---

> The backend `/api/ai-assist` endpoint now supports a new optional `mode` field.
>
> **When to use:** On the maintenance request form screen, when the user interacts with the AI Assistant chat.
>
> **Request changes:**
> - Add `mode: "improve_description"` to the request body.
> - Include current form values in `form_data` (e.g., `maintenance_type`, `location`, `details`).
>
> **Response changes:**
> - The response now includes `improved_description` — a clean, formal version of the description field.
> - Display `reply` in the chat bubble as usual.
> - If `improved_description` is not null, show a green **"Apply to Form"** button below the AI's reply bubble.
> - When tapped, replace the `details` / description text input in the form with the value of `improved_description`.
> - The user should still be able to edit the applied text before submitting.
>
> **Fallback:** If `improved_description` is null (parsing failed), do not show the "Apply" button — only show the chat reply.
