// services/geminiService-server-utils.ts
// This file contains utility functions shared by the Gemini proxy.
// It is NOT imported by the frontend application.
import { Content, FunctionDeclaration, Type, Part } from "@google/genai";
import { AppMode, ChatMessage, MessageRole } from '../types';


export const getSystemInstruction = (mode: AppMode | string): string => {
  switch (mode) {
    case AppMode.BUSINESS_AGENT:
      return `You are an expert AI Business Analyst. Your goal is to help users understand complex business data by synthesizing information from multiple sources.
- When a user asks a question, first formulate a plan.
- Then, use the available tools to fetch the necessary data from different sources (like support tickets, sales data, documents).
- If you need to call multiple tools, you can do so.
- Once you have the data, analyze it and provide a comprehensive, synthesized answer to the user's original question.
- If the tools provide the answer, synthesize it and respond directly. Do not say you used a tool unless it's relevant to the answer.
- Format numerical data in Markdown tables for clarity.`;
    case AppMode.RESEARCH:
       return `You are a world-class research assistant. Your task is to answer the user's question based *only* on the context provided below, which contains abstracts from scientific papers.
- Analyze the provided abstracts carefully.
- Synthesize information to provide a clear, concise, and accurate answer.
- If the context is insufficient, state that clearly.
- Do not use knowledge outside of the provided context.`;
    case AppMode.SUPPORT:
      return `You are a highly-skilled customer support specialist. Your task is to resolve the user's issue based *only* on the context provided, which contains similar past support tickets.
- Analyze the provided tickets to identify the problem and solution.
- Formulate a helpful and empathetic response to the user.
- If no relevant tickets are found, suggest escalating the issue.
- Do not use knowledge outside of the provided context.`;
    case AppMode.GOOGLE_DRIVE:
      return `You are a helpful assistant for Google Drive. Your task is to answer the user's question based *only* on the context provided below from their Google Docs, Sheets, and Slides.
- Analyze the provided document snippets carefully.
- Provide a clear, concise, and accurate answer based exclusively on the given text.
- If the answer is found in a spreadsheet, format your response as a Markdown table.`;
    case AppMode.CUSTOM:
        return `You are a helpful and intelligent assistant. Your task is to answer the user's question based *only* on the context provided below, which contains content from user-uploaded documents.
- Analyze the provided document snippets carefully.
- Provide a clear, concise, and accurate answer based exclusively on the given text.
- Format your response in Markdown, including tables and headers if appropriate.`;
    case AppMode.CODEBASE:
    default:
      return `You are an expert software engineer and senior tech lead. Your task is to answer the user's question based *only* on the context provided below, which contains snippets from a codebase.
- Analyze the provided code snippets carefully.
- Provide a clear, concise, and accurate answer.
- If the context is insufficient to answer, state that clearly.
- Your answer must be based *exclusively* on the text provided. Do not use any external knowledge.
- Format code blocks appropriately in Markdown.`;
  }
};

export const tools: FunctionDeclaration[] = [
    {
        name: 'searchSupportTickets',
        description: 'Searches the knowledge base of customer support tickets for relevant issues and solutions.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: {
                    type: Type.STRING,
                    description: 'The user\'s issue or question to search for, e.g., "login issue" or "billing discrepancy".'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'getSalesData',
        description: 'Retrieves sales data for a specific region. Use this to find financial figures and performance metrics.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                region: {
                    type: Type.STRING,
                    description: 'The geographical region to get sales data for. e.g., "NA", "EMEA", "APAC". If not specified, returns all regions.'
                }
            },
            required: []
        }
    },
];

export const mapHistoryToApi = (chatHistory: ChatMessage[]): Content[] => {
    return chatHistory.map(msg => {
      const parts: Part[] = [];
      if (msg.content) parts.push({ text: msg.content });
      if (msg.image) {
          const [mimeType, data] = msg.image.split(';base64,');
          parts.push({ inlineData: { mimeType: mimeType.replace('data:', ''), data } });
      }
      if (msg.toolCalls) parts.push({ functionCall: msg.toolCalls[0] });
      if (msg.toolResponses) parts.push({ functionResponse: { name: msg.toolResponses[0].name, response: msg.toolResponses[0].response } });
      
      let role: 'user' | 'model' | 'tool';
      switch(msg.role) {
          case MessageRole.USER: role = 'user'; break;
          case MessageRole.MODEL: role = 'model'; break;
          case MessageRole.TOOL: role = 'tool'; break;
          default: role = 'user';
      }
      return { role, parts };
    });
};
