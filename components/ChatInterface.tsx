// components/ChatInterface.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Source, AppMode } from '../types';
import Message from './Message';

// --- Welcome Block Data ---

const promptsByMode = {
    [AppMode.BUSINESS_AGENT]: [
        "Are there any new support tickets about 'billing' in the NA region?",
        "Compare Q3 sales in EMEA with the number of 'login issue' tickets from there.",
        "Summarize the Project Phoenix Kickoff meeting and list the action items.",
        "Who is the main point of contact for our cloud provider?",
    ],
    // ... (other modes remain the same) ...
    [AppMode.CODEBASE]: [ "How is user authentication handled?", "Show me the database schema for a user", "Where are session options configured?", "Explain the API service for updating user profiles", ],
    [AppMode.RESEARCH]: [ "Summarize the main contribution of the 'Attention Is All You Need' paper", "What is BERT and how does it differ from previous models?", "Compare the Transformer architecture to RNNs based on the context", "What are the key benefits of the Transformer model?", ],
    [AppMode.SUPPORT]: [ "A user can't log in and says their reset link expired. What should I do?", "How do I handle a duplicate billing charge for a customer?", "What is the standard procedure for an invalid credentials error?", "Find the resolution for a billing discrepancy.", ],
    [AppMode.WEB_SEARCH]: [ "What were the key announcements at the latest Google I/O?", "Who won the last Formula 1 race and what were the key moments?", "What are the top-rated restaurants near me?", "Explain the latest advancements in AI as of this week.", ],
    [AppMode.GOOGLE_DRIVE]: [ "What are the Q3 revenue projections from the 'Financials' spreadsheet?", "Summarize the meeting notes from the 'Project Phoenix Kickoff' doc.", "Who is the main point of contact listed in the 'Vendor List' sheet?", "Create a table of action items from the 'Weekly Sync' document.", ],
    [AppMode.CUSTOM]: [ "Summarize the main points of the uploaded documents.", "What are the key takeaways from the provided text?", "Based on the documents, what can you tell me about [topic]?", "Extract the most important entities or names mentioned.", ]
};

const titlesByMode = {
    [AppMode.BUSINESS_AGENT]: "AI Business Analyst Agent",
    [AppMode.CODEBASE]: "Welcome to Elastic CodeMind",
    [AppMode.RESEARCH]: "AI Research Assistant",
    [AppMode.SUPPORT]: "AI Support Assistant",
    [AppMode.WEB_SEARCH]: "Real-Time Web Assistant",
    [AppMode.GOOGLE_DRIVE]: "Chat With Your Google Drive",
    [AppMode.CUSTOM]: "Chat With Your Documents"
};

// ... (WelcomeBlock component and Icons remain the same) ...
const WelcomeBlock: React.FC<{
  mode: AppMode;
  onSendMessage: (query: string) => void;
  isCustomDatasetEmpty: boolean;
  onFileUpload: (fileList: FileList) => void;
}> = ({ mode, onSendMessage, isCustomDatasetEmpty, onFileUpload }) => {
    const examplePrompts = promptsByMode[mode];
    const title = titlesByMode[mode];
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (mode === AppMode.CUSTOM && isCustomDatasetEmpty) {
        return (
             <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                 <div className="max-w-xl">
                    <div className="mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl inline-block mb-6">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                       </svg>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-100 mb-2">Chat With Your Documents</h2>
                    <p className="text-lg text-gray-400 mb-8">
                       Upload your text files or a project folder to begin. The chat will start automatically.
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-cyan-500 transition-colors duration-200"
                    >
                        Upload Files or Folder
                    </button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && onFileUpload(e.target.files)}
                        className="hidden"
                        multiple
                        {...{ webkitdirectory: "true", mozdirectory: "true" }}
                    />
                 </div>
             </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="max-w-3xl">
                 <div className="mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl inline-block mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C13.9782 20 15.7952 19.3425 17.25 18.25L12 13V11L18.25 4.75C16.7952 4.19531 15.1983 3.94828 13.565 4.02058L12 4Z" fill="currentColor"/>
                    </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-100 mb-2">{title}</h2>
                <p className="text-lg text-gray-400 mb-10">
                    This AI agent can access multiple data sources to answer complex questions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {examplePrompts.map((prompt, index) => (
                        <button
                            key={index}
                            onClick={() => onSendMessage(prompt)}
                            className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 hover:bg-slate-700/80 hover:border-cyan-600 transition-all duration-200 cursor-pointer text-gray-300"
                        >
                            <p className="font-semibold">{prompt}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Icons ---
const SendIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>);
const AttachmentIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>);
const MicIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 5.25v-1.5a6 6 0 0 0-12 0v1.5m12 0a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" /></svg>);
const CloseIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);


// --- Main Chat Interface ---

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (query: string, image?: string) => void;
  onSelectSource: (source: Source) => void;
  mode: AppMode;
  isCustomDatasetEmpty: boolean;
  onFileUpload: (fileList: FileList) => void;
  onPlayAudio: (text: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage, onSelectSource, mode, isCustomDatasetEmpty, onFileUpload, onPlayAudio }) => {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null); // SpeechRecognition instance

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.onresult = (event: any) => {
            setInput(prev => prev + event.results[0][0].transcript);
        };
        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };
    }
  }, []);

  const handleMicClick = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        // Handle non-image files via the uploader
        if (event.target.files) {
          onFileUpload(event.target.files);
        }
    }
     event.target.value = ''; // Reset to allow re-uploading
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || imagePreview) {
      onSendMessage(input, imagePreview || undefined);
      setInput('');
      setImagePreview(null);
    }
  };
  
  const isDisabled = isLoading || (mode === AppMode.CUSTOM && isCustomDatasetEmpty);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
            <WelcomeBlock 
              mode={mode} 
              onSendMessage={onSendMessage} 
              isCustomDatasetEmpty={isCustomDatasetEmpty}
              onFileUpload={onFileUpload}
            />
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} onSelectSource={onSelectSource} onPlayAudio={onPlayAudio} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {imagePreview && (
                <div className="relative self-start">
                    <img src={imagePreview} alt="upload preview" className="h-20 w-auto rounded-md object-cover" />
                    <button 
                        type="button" 
                        onClick={() => setImagePreview(null)}
                        className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-0.5 border-2 border-slate-900 hover:bg-slate-700"
                        aria-label="Remove image"
                    >
                        <CloseIcon />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDisabled}
                    className="p-2 text-slate-400 hover:text-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Attach file"
                >
                    <AttachmentIcon />
                </button>
                 <button 
                    type="button"
                    onClick={handleMicClick}
                    disabled={isDisabled}
                    className={`p-2 text-slate-400 hover:text-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                    aria-label={isListening ? "Stop listening" : "Start listening"}
                >
                    <MicIcon />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200"
                    disabled={isDisabled}
                />
                <button
                    type="submit"
                    disabled={isDisabled || (!input.trim() && !imagePreview)}
                    className="bg-cyan-600 text-white rounded-lg p-3 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 transition-colors duration-200"
                    aria-label="Send message"
                >
                    <SendIcon />
                </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
