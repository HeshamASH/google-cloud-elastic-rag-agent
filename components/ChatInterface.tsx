// components/ChatInterface.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, Source, AppMode } from '../types';
import Message from './Message';
import WelcomeScreen from './WelcomeScreen';


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
          <WelcomeScreen onPromptClick={onSendMessage} />
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} onSelectSource={onSelectSource} onPlayAudio={onPlayAudio} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {imagePreview && (
                <div className="relative self-start">
                    <img src={imagePreview} alt="upload preview" className="h-20 w-auto rounded-md object-cover" />
                    <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute -top-2 -right-2 bg-gray-200 text-gray-800 rounded-full p-0.5 border-2 border-white hover:bg-gray-300"
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
                    className="p-2 text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Attach file"
                >
                    <AttachmentIcon />
                </button>
                 <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isDisabled}
                    className={`p-2 text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                    aria-label={isListening ? "Stop listening" : "Start listening"}
                >
                    <MicIcon />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200"
                    disabled={isDisabled}
                />
                <button
                    type="submit"
                    disabled={isDisabled || (!input.trim() && !imagePreview)}
                    className="bg-cyan-600 text-white rounded-lg p-3 hover:bg-cyan-500 disabled:bg-gray-300 disabled:text-gray-500 transition-colors duration-200"
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
