import React from 'react';

interface ThinkingIndicatorProps {
  toolCalls: any[];
}

const formatToolName = (name: string) => {
    // Converts camelCase to Title Case
    const result = name.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

const ToolCallPill: React.FC<{ call: any }> = ({ call }) => {
    const query = call.args.query || call.args.region || '';
    const name = formatToolName(call.name);
    return (
        <div className="bg-slate-700/50 text-slate-300 text-xs px-3 py-1.5 rounded-lg">
            <span className="font-semibold">{name}:</span>
            <span className="font-mono ml-1.5 bg-slate-900/50 px-1.5 py-0.5 rounded">"{query}"</span>
        </div>
    )
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ toolCalls }) => {
  return (
    <div className="flex items-start gap-3 p-2">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 border-2 border-t-cyan-400 border-slate-600 rounded-full animate-spin"></div>
        </div>
        <div>
            <p className="text-sm font-semibold text-slate-300">Thinking...</p>
            <p className="text-sm text-slate-400 mb-2">The agent is using tools to find the answer:</p>
            <div className="flex flex-col items-start gap-1.5">
                {toolCalls.map((call, index) => <ToolCallPill key={index} call={call} />)}
            </div>
        </div>
    </div>
  );
};

export default ThinkingIndicator;
