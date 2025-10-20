// api/gemini-proxy.ts
// FIX: Import the `Buffer` type to resolve the "Cannot find name 'Buffer'" error.
// This is necessary to provide TypeScript with the type definition for Node.js's global Buffer object.
import { Buffer } from 'buffer';
import { GoogleGenAI, Modality, Content, FunctionDeclaration, Type, Part } from "@google/genai";
// Note: We need to import the full path for Vercel's bundler to work correctly
import { getSystemInstruction, tools, mapHistoryToApi } from '../services/geminiService-server-utils';
import { getClient, search as esSearch } from '../services/elastic';

// This function will be deployed as a serverless function on Vercel
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
        const { chatHistory, mode, stream, textToSpeech } = req.body;

        // Handle Text-to-Speech request
        if (textToSpeech) {
            const ttsResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: textToSpeech }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                return res.status(500).json({ message: "No audio data received from API." });
            }
            const buffer = Buffer.from(base64Audio, 'base64');
            res.setHeader('Content-Type', 'application/octet-stream');
            return res.status(200).send(buffer);
        }

        const historyForAi = mapHistoryToApi(chatHistory);

        const lastUserMessage = historyForAi[historyForAi.length - 1].parts[0].text;

        const esClient = getClient();
        const searchResults = await esSearch(esClient, 'codemind-docs', lastUserMessage);

        const context = searchResults.map((result: any) => result.content).join('\n\n');
        const systemInstruction = getSystemInstruction(mode) + '\n\n' + 'Context:\n' + context;


        // Handle Streaming request
        if (stream) {
            const result = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: historyForAi,
                config: { systemInstruction }
            });

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            for await (const chunk of result) {
                if (chunk.text) {
                    res.write(chunk.text);
                }
            }
            return res.end();
        }

        // Handle Non-Streaming (Agentic) request
        const agentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: historyForAi,
            config: {
                systemInstruction,
                tools: mode === 'Business Analyst Agent' ? [{ functionDeclarations: tools }] : undefined,
            },
        });

        return res.status(200).json({
            text: agentResponse.text,
            toolCalls: agentResponse.functionCalls
        });

    } catch (error: any) {
        console.error('Error in Gemini proxy:', error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
