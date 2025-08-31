import React from 'react';
import { AlertTriangle, Trash2, ShieldCheck, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmKeepSaved: () => void;
  deleteCount: number;
  savedCount: number;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onConfirm,
                                                                 onConfirmKeepSaved,
                                                                 deleteCount,
                                                                 savedCount
                                                               }) => {
  if (!isOpen) return null;

  const unsavedCount = deleteCount - savedCount;

  return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
        <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-x1 m-4"
            onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-red-600 dark:text-red-500">
              <AlertTriangle className="w-7 h-7"/>
              Permanent Deletion
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>
          <div className="p-6 text-gray-700 dark:text-gray-300">
            <p className="text-lg">
              You are about to permanently delete <strong className="font-bold">{deleteCount}</strong> photo(s).
            </p>
            <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 rounded-r-lg">
              <p className="font-semibold">
                This selection includes <strong className="font-bold">{savedCount}</strong> photo(s) you've marked as saved.
              </p>
              <p className="text-sm mt-1">
                Deleting them will remove them from your disk forever.
              </p>
            </div>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-end items-center gap-3 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
            <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 bg-gray-200 dark:bg-gray-600 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>

            {unsavedCount > 0 && (
                <button
                    onClick={onConfirmKeepSaved}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition whitespace-nowrap"
                >
                  <ShieldCheck className="w-5 h-5"/>
                  <span>Delete {unsavedCount} Unsaved</span>
                </button>
            )}

            <button
                onClick={onConfirm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 text-red-600 border border-red-600 font-semibold rounded-md hover:bg-red-600 hover:text-white transition whitespace-nowrap"
            >
              <Trash2 className="w-5 h-5"/>
              <span>Delete All {deleteCount}</span>
            </button>
          </div>
        </div>
      </div>
  );
};

export default ConfirmDeleteModal;
