
import React from 'react';
import { PhotoStatus } from '../services/types.ts';
import { Loader, Check, AlertCircle } from 'lucide-react';

export const Spinner: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <Loader className={`${className} animate-spin text-primary`} />
);

export const StatusPill: React.FC<{ status: PhotoStatus }> = ({ status }) => {
    const statusInfo = {
        [PhotoStatus.QUEUED]: { text: 'Queued', icon: <Loader className="w-3 h-3" />, color: 'bg-gray-200 text-gray-700' },
        [PhotoStatus.ANALYZING]: { text: 'Analyzing...', icon: <Spinner className="w-3 h-3" />, color: 'bg-blue-100 text-blue-800' },
        [PhotoStatus.ANALYZED]: { text: 'Analyzed', icon: <Check className="w-3 h-3" />, color: 'bg-green-100 text-green-800' },
        [PhotoStatus.ERROR]: { text: 'Error', icon: <AlertCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-800' },
    };
    const { text, icon, color } = statusInfo[status];
    return (
        <div className={`absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
};
