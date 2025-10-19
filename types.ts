// types.ts

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  TOOL = 'tool', // Added for function calling results
}

// Update AppMode to include the new Business Agent
export enum AppMode {
  BUSINESS_AGENT = 'Business Analyst Agent',
  CODEBASE = 'Codebase',
  RESEARCH = 'Research Papers',
  SUPPORT = 'Support Tickets',
  WEB_SEARCH = 'Web Search',
  GOOGLE_DRIVE = 'Google Drive',
  CUSTOM = 'Your Documents',
}

export interface Source {
  fileName: string;
  path: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface ChatMessage {
  id: string; // Unique ID for each message for React keys
  role: MessageRole;
  content: string;
  image?: string; // base64 data URL for user-uploaded images
  sources?: ElasticResult[]; // Changed from Source[] to ElasticResult[] to include snippets
  groundingSources?: GroundingSource[]; // For web search results
  toolCalls?: any[]; // To store model's request to call a tool
  toolResponses?: any[]; // To store the result of a tool call
  toolCallPlan?: any[]; // To render the "thinking" step before execution
}

export interface ElasticResult {
  source: Source;
  contentSnippet: string;
  score: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: AppMode;
  customDataset?: ElasticResult[];
}