import React from 'react';
import { ElasticResult } from '../types';

interface SourceDetailCardProps {
  sourceResult: ElasticResult;
  onSelectSource: () => void;
}

const FileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-slate-400 flex-shrink-0">
        <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h6.89a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061v5.758A1.5 1.5 0 0 1 12.5 13H3.5A1.5 1.5 0 0 1 2 11.5v-8Z" />
    </svg>
);

const SourceDetailCard: React.FC<SourceDetailCardProps> = ({ sourceResult, onSelectSource }) => {
  return (
    <div 
      onClick={onSelectSource}
      className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-700/80 hover:border-cyan-600 transition-all duration-200 cursor-pointer"
    >
        <div className="flex items-start gap-2">
            <FileIcon />
            <div className="overflow-hidden">
                <p className="text-sm font-semibold text-cyan-400 truncate" title={sourceResult.source.fileName}>
                    {sourceResult.source.fileName}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate" title={sourceResult.source.path}>
                    {sourceResult.source.path}
                </p>
            </div>
        </div>
        <div className="mt-2 pl-1">
            <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-md font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                ...{sourceResult.contentSnippet}...
            </p>
        </div>
    </div>
  );
};

export default SourceDetailCard;