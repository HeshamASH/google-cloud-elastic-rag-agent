import React, { useRef, useEffect } from 'react';
import { Source } from '../types';

declare var hljs: any;

interface FileViewerProps {
  file: Source;
  content: string;
  onClose: () => void;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const FileViewer: React.FC<FileViewerProps> = ({ file, content, onClose }) => {
  const codeRef = useRef<HTMLElement>(null);
  const language = file.fileName.split('.').pop() || 'plaintext';

  useEffect(() => {
    if (codeRef.current && content !== 'Loading...' && typeof hljs !== 'undefined') {
      hljs.highlightElement(codeRef.current);
    }
  }, [content]);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-cyan-400">{file.fileName}</h3>
            <p className="text-sm text-slate-400 font-mono">{file.path}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close file viewer">
            <CloseIcon />
          </button>
        </header>
        <main className="p-4 overflow-auto">
          <pre className="bg-slate-950 rounded-md p-4 overflow-x-auto">
            <code ref={codeRef} className={`text-sm font-mono whitespace-pre-wrap language-${language}`}>
              {content}
            </code>
          </pre>
        </main>
      </div>
    </div>
  );
};

export default FileViewer;