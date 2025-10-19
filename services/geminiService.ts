// services/geminiService.ts
import { AppMode, ChatMessage } from '../types';

// The new agentic turn function now calls our secure proxy
export const runAgenticTurn = async (
    chatHistory: ChatMessage[],
    mode: AppMode
): Promise<{ text?: string; toolCalls?: any[] }> => {
    const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatHistory,
            mode,
            stream: false // We need the full response for the agent's plan
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get agent response from proxy.");
    }

    return response.json();
};

// The streaming function now calls our secure proxy
export const streamTextResponse = async (
    chatHistory: ChatMessage[],
    mode: AppMode
): Promise<AsyncGenerator<{ text: string }>> => {
    const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chatHistory,
            mode,
            stream: true
        }),
    });

    if (!response.ok || !response.body) {
         const error = await response.json();
        throw new Error(error.message || "Failed to stream text from proxy.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    async function* controlledStream() {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            yield { text };
        }
    }

    return controlledStream();
};

// The text-to-speech function now calls our secure proxy
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
    const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            textToSpeech: text
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get audio from proxy.");
    }
    
    // The proxy returns the ArrayBuffer directly
    return response.arrayBuffer();
};