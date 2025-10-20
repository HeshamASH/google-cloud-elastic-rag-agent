import React from 'react';
import { AppMode } from '../types';

const ElasticLogo: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C13.9782 20 15.7952 19.3425 17.25 18.25L12 13V11L18.25 4.75C16.7952 4.19531 15.1983 3.94828 13.565 4.02058L12 4Z" fill="currentColor"/>
  </svg>
);

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

const MenuOpenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const MenuCloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


interface HeaderProps {
    mode: AppMode;
    onModeChange: (mode: AppMode) => void;
    onToggleFileSearch: () => void;
    onToggleHistory: () => void;
    isHistoryVisible: boolean;
    selectedModel: string;
    onModelChange: (model: string) => void;
}

const Header: React.FC<HeaderProps> = ({ mode, onModeChange, onToggleFileSearch, onToggleHistory, isHistoryVisible, selectedModel, onModelChange }) => {
  return (
    <header className="px-4 py-3 border-b border-gray-200 bg-white/70 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
            onClick={onToggleHistory}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle chat history"
        >
          {isHistoryVisible ? <MenuCloseIcon/> : <MenuOpenIcon/>}
        </button>
        <div className="flex items-center gap-3">
            <ElasticLogo />
            <div>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Elastic CodeMind</h1>
            </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as AppMode)}
            className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 appearance-none"
            aria-label="Select application mode"
          >
            {Object.values(AppMode).map(m => <option key={m} value={m}>{m}</option>)}
         </select>
         <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 appearance-none"
            aria-label="Select AI model"
          >
            <option value="vertex-ai">Vertex AI</option>
            <option value="gemini-2.5-flash-lite-preview-09-2025">Gemini Flash Lite</option>
         </select>
         <button
            onClick={onToggleFileSearch}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg border border-gray-300 transition-colors duration-200"
            aria-label="Search files"
        >
            <SearchIcon />
            <span className="hidden sm:inline">Search Files</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
