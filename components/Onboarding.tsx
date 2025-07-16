
import React, { useState } from 'react';
import { UserProfile } from '../services/types.ts';
import { Smile, Zap } from 'lucide-react';

interface OnboardingProps {
  onProfileSave: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onProfileSave }) => {
  const [firstName, setFirstName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim()) {
      const newProfile: UserProfile = {
        firstName: firstName.trim(),
        rules: [
          {id: '1', label: 'cat', confidence: 80},
          {id: '2', label: 'dog', confidence: 80},
        ],
        autoApplyRules: true,
      };
      onProfileSave(newProfile);
    }
  };

  return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md w-full">
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-5xl font-bold text-primary dark:text-primary-light">Welcome!</h1>
            <Smile className="w-14 h-14 ml-3 text-secondary" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            I'm here to help you sort your photos. What should I call you?
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
                required
            />
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
            >
              Let's Get Started <Zap className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
  );
};

export default Onboarding;