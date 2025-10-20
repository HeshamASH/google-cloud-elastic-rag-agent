import React from 'react';
import { ChatSession } from '../types';

interface ChatHistoryProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewSession: () => void;
    onDeleteSession: (id: string) => void;
    isVisible: boolean;
}

const PlusIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const ChatIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72.372a11.25 11.25 0 0 1-5.273 0l-3.72-.372A2.067 2.067 0 0 1 3 14.894V10.608c0-.97.616-1.813 1.5-2.097L6.75 8.25m.75 12.75-1.25-1.25a3.375 3.375 0 0 1 0-4.773l1.25-1.25m10.5 6.023-1.25-1.25a3.375 3.375 0 0 0 0-4.773l1.25-1.25" /></svg>);
const TrashIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);


const ChatHistory: React.FC<ChatHistoryProps> = ({ sessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession, isVisible }) => {
    if (!isVisible) {
        return null;
    }
    
    return (
        <aside className="w-64 bg-gray-50 flex flex-col flex-shrink-0 border-r border-gray-200">
            <div className="p-3 flex items-center justify-between border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">History</h2>
                <button 
                    onClick={onNewSession}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="New chat"
                >
                    <PlusIcon />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map(session => (
                    <div 
                        key={session.id} 
                        className={`group flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors ${
                            activeSessionId === session.id ? 'bg-cyan-100/50' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => onSelectSession(session.id)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                           <ChatIcon />
                           <span className="truncate text-sm font-medium">{session.title}</span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Delete chat: ${session.title}`}
                        >
                            <TrashIcon/>
                        </button>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default ChatHistory;