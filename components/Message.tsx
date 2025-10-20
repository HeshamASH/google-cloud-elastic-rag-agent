import React, { useRef, useEffect } from 'react';
import { ChatMessage, MessageRole, Source, GroundingSource, ElasticResult } from '../types';
import SourceDetailCard from './SourceDetailCard';
import ThinkingIndicator from './ThinkingIndicator';
import { marked } from 'marked';
import DOMPurify from 'dompurify';


declare var hljs: any;

interface MessageProps {
  message: ChatMessage;
  onSelectSource: (source: Source) => void;
  onPlayAudio: (text: string) => void;
}

const UserIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>);
const ModelIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9.603 13.689c.143.434.295.862.457 1.282a.75.75 0 0 1-1.42.498 9.003 9.003 0 0 1-.52-1.486.75.75 0 0 1 1.483-.594Zm4.137-.012a.75.75 0 0 1 1.42.498 9.003 9.003 0 0 1-.52 1.486.75.75 0 1 1-1.483-.594c.162-.42.314-.848.457-1.282ZM11.25 8.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" /><path fillRule="evenodd" d="M12 21.75c-1.66 0-3.213-.42-4.596-1.182a.75.75 0 0 1 .598-1.415 7.502 7.502 0 0 0 8-10.425.75.75 0 0 1 1.415-.598A9.003 9.003 0 0 1 12 21.75Z" /></svg>);
const SpeakerIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>);
const WebIcon: React.FC = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM2.05 8a6.002 6.002 0 0 1 9.539-5.105l-9.634 9.634A5.96 5.96 0 0 1 2.05 8Zm4.475 5.105a6.002 6.002 0 0 1-5.105-9.539l9.634 9.634a5.96 5.96 0 0 1-4.529-.095Z" /></svg>);


const CodeBlock: React.FC<{ code: string; language?: string; }> = ({ code, language }) => {
  const codeRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (codeRef.current && typeof hljs !== 'undefined') {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const langClass = language ? `language-${language}` : 'plaintext';

  return (
    <pre className="bg-slate-950 rounded-md my-2">
      <code ref={codeRef} className={`text-sm font-mono block p-4 overflow-x-auto ${langClass}`}>
        {code}
      </code>
    </pre>
  );
};

// --- Refactored Markdown Renderer ---
// FIX: The renderer functions are updated for a newer version of `marked` which uses a token-based API
// to address breaking changes in the library and fix type errors.
const renderer = {
  table: (token: any) => {
    let header = '';
    if (token.header && token.header.length) {
      header += '<tr>';
      token.header.forEach((cell: any, cellIndex: number) => {
        const align = token.align[cellIndex] ? ` align="${token.align[cellIndex]}"` : '';
        // Use marked.parseInline to render cell content, which can contain other markdown.
        header += `<th class="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"${align}>${marked.parseInline(cell.text)}</th>`;
      });
      header += '</tr>';
    }

    let body = '';
    if (token.rows && token.rows.length) {
      token.rows.forEach((row: any[]) => {
        body += '<tr>';
        row.forEach((cell: any, cellIndex: number) => {
          const align = token.align[cellIndex] ? ` align="${token.align[cellIndex]}"` : '';
          body += `<td class="px-4 py-2 text-sm text-slate-400"${align}>${marked.parseInline(cell.text)}</td>`;
        });
        body += '</tr>';
      });
    }

    // Only render table if it has content
    if (!header && !body) {
      return '';
    }

    return `<table class="min-w-full divide-y divide-slate-700 border border-slate-700 my-4">
              <thead class="bg-slate-800">${header}</thead>
              <tbody class="divide-y divide-slate-800 bg-slate-900">${body}</tbody>
            </table>`;
  },
  heading: (token: any) => {
    const { text, depth: level } = token;
    const baseClasses = "font-bold mt-4 mb-2";
    let sizeClass = "";
    switch (level) {
      case 1: sizeClass = "text-2xl border-b border-slate-700 pb-2"; break;
      case 2: sizeClass = "text-xl border-b border-slate-700 pb-2"; break;
      case 3: sizeClass = "text-lg"; break;
      default: sizeClass = "text-base";
    }
    return `<h${level} class="${baseClasses} ${sizeClass}">${text}</h${level}>`;
  }
};


// Use the custom renderer
marked.use({ renderer });

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Parse the markdown text into HTML using our custom renderer
    const dirtyHtml = marked.parse(text) as string;
    // Sanitize the resulting HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(dirtyHtml);

    // Render the sanitized HTML. The parent `prose` classes will handle
    // styling for standard elements like lists, paragraphs, etc.
    return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
};


const Message: React.FC<MessageProps> = ({ message, onSelectSource, onPlayAudio }) => {
  const isModel = message.role === MessageRole.MODEL;

  const renderContent = (content: string) => {
    // Split content by code blocks to render them with syntax highlighting
    const parts = content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);
    return parts.filter(Boolean).map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.trim().split('\n');
        const langMatch = lines[0].match(/\`\`\`(\w*)/);
        const language = langMatch ? langMatch[1] : '';
        const code = lines.slice(1, -1).join('\n');
        return <CodeBlock key={index} code={code} language={language} />;
      }
      // Render all other parts using our improved MarkdownRenderer
      return <MarkdownRenderer key={index} text={part} />;
    });
  };

  return (
    <div className={`flex items-start gap-4 ${!isModel && 'flex-row-reverse'}`}>
      <div className={`rounded-full p-2 flex-shrink-0 mt-1 ${isModel ? 'bg-cyan-800 text-cyan-300' : 'bg-slate-700 text-slate-300'}`}>
        {isModel ? <ModelIcon /> : <UserIcon />}
      </div>
      <div className={`max-w-3xl w-full flex flex-col ${!isModel && 'items-end'}`}>
        <div className={`rounded-lg px-5 py-3 w-full prose prose-invert prose-sm text-gray-200 max-w-none ${isModel ? 'bg-slate-800' : 'bg-cyan-700'}`}>
           {message.image && (
                <img src={message.image} alt="user upload" className="rounded-md max-w-xs mb-3" />
            )}
           
          {message.toolCallPlan ? (
             <ThinkingIndicator toolCalls={message.toolCallPlan} />
          ) : (
            <div>
              {renderContent(message.content) || (isModel && <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block animate-pulse"></span>)}
            </div>
          )}
        </div>
        
        <div className="mt-3 w-full">
            {isModel && (
                <div className="flex items-center justify-end">
                     {message.content && (
                       <button onClick={() => onPlayAudio(message.content)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors" aria-label="Read response aloud">
                          <SpeakerIcon />
                       </button>
                    )}
                </div>
            )}
        </div>

        {isModel && message.sources && message.sources.length > 0 && (
          <div className="mt-2 w-full border-t border-slate-700/50 pt-3">
              <h4 className="text-xs text-slate-400 font-semibold mb-2">Sources Referenced</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {message.sources.map((source, index) => (
                      <SourceDetailCard key={index} sourceResult={source} onSelectSource={() => onSelectSource(source.source)} highlightedText={source.highlight?.content[0]} />
                  ))}
              </div>
          </div>
        )}

        {isModel && message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 w-full">
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-slate-400 font-medium mr-1">Web:</span>
                    {message.groundingSources.map((source, index) => (
                        <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full transition-colors duration-200">
                        <WebIcon />
                        <span>{source.title}</span>
                        </a>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Message;
