// components/WelcomeScreen.tsx
import React from 'react';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptClick }) => {
  const prompts = [
    "ask for refund",
    "change delivery date",
    "says deliverd but I didn't recive the order",
    "provide delivery feedback"
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white text-gray-800 p-4">
      <h1 className="text-4xl font-bold mb-2">Welcome to our most helpful customer service agent</h1>
      <p className="text-lg text-gray-600 mb-8">ask any question ask for refund, change the delivery date</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
