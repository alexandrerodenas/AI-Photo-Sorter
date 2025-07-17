
import React from 'react';
import { PhotoStatus } from '../services/types.ts';
import { Loader, Check, AlertCircle, HelpCircle } from 'lucide-react';

export const Spinner: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <Loader className={`${className} animate-spin text-primary`} />
);

export const StatusPill: React.FC<{ status: PhotoStatus }> = ({ status }) => {
    const statusInfo = {
        [PhotoStatus.QUEUED]: { text: 'Queued', icon: <Loader className="w-3 h-3" />, color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
        [PhotoStatus.ANALYZING]: { text: 'Analyzing...', icon: <Spinner className="w-3 h-3" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
        [PhotoStatus.ANALYZED]: { text: 'Analyzed', icon: <Check className="w-3 h-3" />, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        [PhotoStatus.UNCATEGORIZED]: { text: 'Uncategorized', icon: <HelpCircle className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
        [PhotoStatus.ERROR]: { text: 'Error', icon: <AlertCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    };
    const info = statusInfo[status as keyof typeof statusInfo];
    if (!info) return null;

    const { text, icon, color } = info;
    return (
        <div className={`absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
};