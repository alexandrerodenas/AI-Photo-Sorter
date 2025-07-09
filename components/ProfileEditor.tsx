
import React, { useState, useRef } from 'react';
import type { UserProfile } from '../types';
import { Trash2, PlusCircle, Save, Upload, Download } from 'lucide-react';

interface ProfileEditorProps {
  currentProfile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  closeModal: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ currentProfile, onSave, closeModal }) => {
  const [profile, setProfile] = useState<UserProfile>(JSON.parse(JSON.stringify(currentProfile)));
  const [newRule, setNewRule] = useState({ label: '', confidence: 75 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(profile);
    closeModal();
  };

  const handleAddRule = () => {
    if (!newRule.label) return;
    setProfile(p => ({
      ...p,
      rules: [...p.rules, { ...newRule, id: Date.now().toString() }]
    }));
    setNewRule({ label: '', confidence: 75 });
  };

  const handleRemoveRule = (id: string) => {
    setProfile(p => ({...p, rules: p.rules.filter(rule => rule.id !== id)}));
  };

  const handleExportProfile = () => {
    try {
      const profileJson = JSON.stringify(profile, null, 2);
      const blob = new Blob([profileJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_sorter_profile_${profile.firstName.toLowerCase().replace(/\s/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export profile:", error);
      alert("An error occurred while exporting your profile.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const importedProfile = JSON.parse(text);

        // Basic validation
        if (typeof importedProfile.firstName === 'string' && Array.isArray(importedProfile.rules) && typeof importedProfile.autoApplyRules === 'boolean') {
          setProfile(importedProfile);
          alert("Profile imported successfully! Review the changes and click 'Save Changes' to apply them.");
        } else {
          throw new Error("Invalid profile file format.");
        }
      } catch (error) {
        console.error("Failed to import profile:", error);
        alert("Failed to import profile. Please make sure it's a valid JSON file exported from this application.");
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsText(file);

    // Reset the input value to allow re-importing the same file
    if(event.target) event.target.value = '';
  };


  return (
      <div className="space-y-6">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
        />
        <div>
          <label className="block font-semibold mb-1">First Name</label>
          <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary"/>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={profile.autoApplyRules} onChange={e => setProfile({...profile, autoApplyRules: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary"/>
            <span>Automatically apply rules on photo load</span>
          </label>
        </div>

        {/* Rules Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold">Filter Rules</h3>
          {profile.rules.length === 0 && <p className="text-gray-500 text-sm">No rules defined. Add one below!</p>}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {profile.rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                  <span className="font-semibold px-2 py-1 text-xs rounded-full bg-accent/20 text-accent">SELECT</span>
                  <span>if label contains</span>
                  <span className="font-semibold text-primary">{`"${rule.label}"`}</span>
                  <span>with confidence</span>
                  <span className="font-semibold text-primary">{`> ${rule.confidence}%`}</span>
                  <button onClick={() => handleRemoveRule(rule.id)} className="ml-auto p-1 rounded-full hover:bg-red-200"><Trash2 className="w-4 h-4 text-red-600"/></button>
                </div>
            ))}
          </div>
        </div>

        {/* New Rule Form */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold">Add New Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input type="text" placeholder="e.g., person" value={newRule.label} onChange={e => setNewRule({...newRule, label: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confidence ({newRule.confidence}%)</label>
              <input type="range" min="1" max="100" value={newRule.confidence} onChange={e => setNewRule({...newRule, confidence: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"/>
            </div>
          </div>
          <button onClick={handleAddRule} className="mt-4 flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-dark transition">
            <PlusCircle className="w-5 h-5"/> Add Rule
          </button>
        </div>

        <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button onClick={handleImportClick} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              <Upload className="w-4 h-4"/> Import
            </button>
            <button onClick={handleExportProfile} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              <Download className="w-4 h-4"/> Export
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={closeModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition">
              <Save className="w-5 h-5"/> Save Changes
            </button>
          </div>
        </div>
      </div>
  );
};
