// App.tsx
// FIX: Correctly import React hooks inside curly braces.
import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessageRole, Source, AppMode, ElasticResult, ChatSession } from './types';
import { getAllFiles, getFileContent, createDatasetFromFileList, searchSupportTickets, getSalesData } from './services/elasticService';
import { runAgenticTurn, streamTextResponse, textToSpeech } from './services/geminiService';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import FileSearch from './components/FileSearch';
import FileViewer from './components/FileViewer';
import ChatHistory from './components/ChatHistory';
import { v4 as uuidv4 } from 'uuid';
import { playAudio } from './services/audioUtils';
import * as chatHistoryService from './services/chatHistoryService';


const App: React.FC = () => {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allFiles, setAllFiles] = useState<Source[]>([]);
  const [isFileSearchVisible, setIsFileSearchVisible] = useState<boolean>(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<Source | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  
  const activeSession = activeSessionId ? sessions[activeSessionId] : null;

  // Load history from Elasticsearch on initial render
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // FIX: Explicitly initialize the chat history service before using it.
        await chatHistoryService.initializeChatHistory();
        const loadedSessions = await chatHistoryService.loadAllSessions();
        if (loadedSessions && Object.keys(loadedSessions).length > 0) {
          setSessions(loadedSessions);
          // Load the last session by sorting them (assuming IDs are somewhat chronological, or add a timestamp)
          const sortedSessionIds = Object.keys(loadedSessions).sort((a, b) => (loadedSessions[b].title > loadedSessions[a].title ? -1 : 1));
          setActiveSessionId(sortedSessionIds[0]);
        } else {
          createNewSession();
        }
      } catch (error) {
        console.error("Failed to load sessions from Elasticsearch:", error);
        // Fallback to a new session if loading fails
        createNewSession();
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!activeSession) return;
      try {
        const files = await getAllFiles(activeSession.mode, activeSession.customDataset);
        setAllFiles(files);
      } catch (error) {
        console.error("Failed to fetch file list:", error);
      }
    };
    fetchFiles();
  }, [activeSession]);

  const createNewSession = useCallback(async (mode: AppMode = AppMode.BUSINESS_AGENT) => {
    const newId = uuidv4();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Agent Chat',
      messages: [],
      mode,
    };
    await chatHistoryService.saveSession(newSession);
    setSessions(prev => ({ ...prev, [newId]: newSession }));
    setActiveSessionId(newId);
    return newId;
  }, []);
  
  const updateSession = async (updatedSession: ChatSession) => {
    setSessions(prev => ({...prev, [updatedSession.id]: updatedSession}));
    await chatHistoryService.saveSession(updatedSession);
  }

  const handleSendMessage = useCallback(async (query: string, image?: string) => {
    if (!query.trim() || isLoading || !activeSessionId || !activeSession) return;

    setIsLoading(true);

    const userMessage: ChatMessage = { id: uuidv4(), role: MessageRole.USER, content: query, image };
    const isFirstMessage = (activeSession.messages || []).length === 0;
    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      title: isFirstMessage ? query.substring(0, 50) : activeSession.title,
    };
    updateSession(updatedSession);
    
    let currentMessages = updatedSession.messages;

    try {
      let sourcesForFinalMessage: ElasticResult[] = [];
      let thinkingMessageId: string | null = null;

      for (let i = 0; i < 5; i++) {
        // FIX: The `runAgenticTurn` function only accepts two arguments, `chatHistory` and `mode`.
        // The `customDataset` is not used in agentic mode and was causing an error.
        const agentResponse = await runAgenticTurn(currentMessages, activeSession.mode);

        if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
          thinkingMessageId = uuidv4();
          const thinkingMessage: ChatMessage = { id: thinkingMessageId, role: MessageRole.MODEL, content: '', toolCallPlan: agentResponse.toolCalls };
          updateSession({...updatedSession, messages: [...currentMessages, thinkingMessage] });

          const toolRequestMessage: ChatMessage = { id: uuidv4(), role: MessageRole.MODEL, content: '', toolCalls: agentResponse.toolCalls };
          const toolResponses: any[] = [];
          sourcesForFinalMessage = [];
          
          for (const call of agentResponse.toolCalls) {
            let result;
            switch (call.name) {
              case 'searchSupportTickets': result = await searchSupportTickets(call.args.query); break;
              case 'getSalesData': result = await getSalesData(call.args.region); break;
              default: result = { error: `Tool ${call.name} not found.` };
            }
            if (Array.isArray(result)) sourcesForFinalMessage.push(...result);
            toolResponses.push({ id: call.id, name: call.name, response: { result: JSON.stringify(result) } });
          }
          
          const toolResponseMessage: ChatMessage = { id: uuidv4(), role: MessageRole.TOOL, content: '', toolResponses };
          currentMessages.push(toolRequestMessage, toolResponseMessage);
          continue; 

        } else if (agentResponse.text) {
          const finalModelMessage: ChatMessage = { id: uuidv4(), role: MessageRole.MODEL, content: agentResponse.text, sources: agentResponse.sources };
          
          let finalMessages = [...currentMessages];
          if(thinkingMessageId) finalMessages = finalMessages.filter(m => m.id !== thinkingMessageId);
          finalMessages.push(finalModelMessage);
          
          updateSession({...updatedSession, messages: finalMessages});
          break;
        
        } else {
            const finalModelMessage: ChatMessage = { id: uuidv4(), role: MessageRole.MODEL, content: "I was unable to find a specific answer or action. How else can I help?" };
            let finalMessages = [...currentMessages];
            if(thinkingMessageId) finalMessages = finalMessages.filter(m => m.id !== thinkingMessageId);
            finalMessages.push(finalModelMessage);
            updateSession({...updatedSession, messages: finalMessages});
            break;
        }
      }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        const errorMsg: ChatMessage = { id: uuidv4(), role: MessageRole.MODEL, content: `Sorry, I encountered an error: ${errorMessage}`};
        updateSession({...updatedSession, messages: [...currentMessages, errorMsg]});
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, activeSessionId, activeSession, sessions]);

  
  const handleModeChange = useCallback(async (newMode: AppMode) => {
    if (activeSession && activeSession.messages.length === 0) {
      const updatedSession = { ...activeSession, mode: newMode, title: `New ${newMode} Chat` };
      updateSession(updatedSession);
    } else {
      await createNewSession(newMode);
    }
  }, [activeSession, createNewSession]);
  
  const handleFilesUploaded = useCallback(async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;
    setIsLoading(true);
    try {
        await createDatasetFromFileList(fileList);
        const newId = await createNewSession(AppMode.CUSTOM);
        
        // We need to fetch the newly created session to update it
        setSessions(prev => {
            const newSession = { ...prev[newId], title: "Custom: " + Array.from(fileList).map(f => f.name).join(', ').substring(0, 40) };
            updateSession(newSession); // Save the update to elastic
            return {...prev, [newId]: newSession };
        });

    } catch (error) {
        console.error("Error processing uploaded files:", error);
    } finally {
        setIsLoading(false);
    }
  }, [createNewSession]);

  const handleToggleFileSearch = useCallback(() => setIsFileSearchVisible(prev => !prev), []);
  const handleToggleHistory = useCallback(() => setIsHistoryVisible(prev => !prev), []);

  const handleSelectFile = useCallback(async (file: Source) => {
    if (!activeSession) return;
    setSelectedFile(file);
    setSelectedFileContent('Loading...');
    const content = await getFileContent(file, activeSession.mode, activeSession.customDataset);
    setSelectedFileContent(content ?? 'Could not load file content.');
  }, [activeSession]);

  const handleCloseFileViewer = useCallback(() => {
    setSelectedFile(null);
    setSelectedFileContent('');
  }, []);

  const handleSelectSession = (id: string) => setActiveSessionId(id);
  
  const handleDeleteSession = async (id: string) => {
    await chatHistoryService.deleteSession(id);
    const newSessions = { ...sessions };
    delete newSessions[id];
    
    if (activeSessionId === id) {
        const remainingIds = Object.keys(newSessions);
        if (remainingIds.length > 0) {
            setActiveSessionId(remainingIds[0]);
        } else {
            const newId = await createNewSession();
            setActiveSessionId(newId);
            // This is async, so we need to get the new session object
            const newSess = await chatHistoryService.loadSession(newId);
            if(newSess) setSessions({[newId]: newSess});
            else setSessions({}); // Should not happen
            return;
        }
    }
     setSessions(newSessions);
  };

  const handlePlayAudio = async (text: string) => {
    try {
      const audioData = await textToSpeech(text);
      playAudio(audioData);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-gray-200 font-sans">
      <ChatHistory 
        sessions={Object.values(sessions)}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={createNewSession}
        onDeleteSession={handleDeleteSession}
        isVisible={isHistoryVisible}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          mode={activeSession?.mode || AppMode.BUSINESS_AGENT}
          onModeChange={handleModeChange}
          onToggleFileSearch={handleToggleFileSearch} 
          onToggleHistory={handleToggleHistory}
          isHistoryVisible={isHistoryVisible}
        />
        <div className="flex-1 flex overflow-hidden relative">
          <main className="flex-1 overflow-hidden">
             {activeSession ? (
                <ChatInterface 
                    messages={activeSession.messages} 
                    isLoading={isLoading} 
                    onSendMessage={handleSendMessage} 
                    onSelectSource={handleSelectFile}
                    mode={activeSession.mode}
                    isCustomDatasetEmpty={activeSession.mode === AppMode.CUSTOM && (!activeSession.customDataset || activeSession.customDataset.length === 0)}
                    onFileUpload={handleFilesUploaded}
                    onPlayAudio={handlePlayAudio}
                />
             ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                    <p>Select or create a new chat to begin.</p>
                </div>
             )}
          </main>
          
          <div className={`absolute top-0 right-0 h-full w-full md:w-80 lg:w-96 z-20 transition-transform duration-300 ease-in-out ${isFileSearchVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <FileSearch files={allFiles} onClose={handleToggleFileSearch} onSelectFile={handleSelectFile}/>
          </div>

          {selectedFile && (
            <FileViewer
              file={selectedFile}
              content={selectedFileContent}
              onClose={handleCloseFileViewer}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
