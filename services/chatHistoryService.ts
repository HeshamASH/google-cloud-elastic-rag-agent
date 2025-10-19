// services/chatHistoryService.ts
import { ChatSession } from '../types';

const ELASTIC_API_ENDPOINT = '/api/elastic-proxy';

// A wrapper to handle fetch requests to our secure proxy
const fetchFromProxy = async (action: string, params?: any) => {
    const response = await fetch(ELASTIC_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Elastic proxy action '${action}' failed.`);
    }
    return response.json();
}

export const initializeChatHistory = async (): Promise<void> => {
    // Initialization is now handled by the serverless function on its first run.
    // We can still call this to ensure the endpoint is warm, but it's not strictly necessary.
    try {
        await fetchFromProxy('initialize');
    } catch (error) {
        console.error("Failed to initialize chat history via proxy:", error);
    }
};

export const saveSession = async (session: ChatSession): Promise<void> => {
  try {
    await fetchFromProxy('saveSession', { session });
  } catch (error) {
    console.error(`Failed to save session ${session.id}:`, error);
  }
};

export const loadSession = async (sessionId: string): Promise<ChatSession | null> => {
    try {
        const { session } = await fetchFromProxy('loadSession', { sessionId });
        return session;
    } catch (error) {
         console.error(`Failed to load session ${sessionId}:`, error);
         return null;
    }
};

export const loadAllSessions = async (): Promise<Record<string, ChatSession>> => {
  try {
    const { sessions } = await fetchFromProxy('loadAllSessions');
    return sessions;
  } catch (error) {
    console.error("Failed to load all sessions:", error);
    return {};
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
    try {
        await fetchFromProxy('deleteSession', { sessionId });
    } catch (error) {
         console.error(`Failed to delete session ${sessionId}:`, error);
    }
};