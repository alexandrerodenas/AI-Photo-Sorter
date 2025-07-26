import React, { useState, useRef } from 'react';
import type { UserProfile, ThumbnailSize, FilterRule } from '../services/types.ts';
import { Trash2, PlusCircle, Save, Upload, Download, Bot, Boxes, Pencil, Check, X } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput.tsx';

interface ProfileEditorProps {
  currentProfile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  closeModal: () => void;
  allAvailableClassificationLabels: string[];
  allAvailableDetectionLabels: string[];
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ currentProfile, onSave, closeModal, allAvailableClassificationLabels, allAvailableDetectionLabels }) => {
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...currentProfile,
    classificationRules: currentProfile.classificationRules || [],
    detectionRules: currentProfile.detectionRules || [],
    unknownThreshold: currentProfile.unknownThreshold ?? 10,
    thumbnailSize: currentProfile.thumbnailSize ?? 'M',
  }));

  // State for adding new rules
  const [newClassificationRule, setNewClassificationRule] = useState({ label: '', confidence: 75 });
  const [isClassificationAnyConfidence, setIsClassificationAnyConfidence] = useState(false);

  const [newDetectionRule, setNewDetectionRule] = useState({ label: '', confidence: 75 });
  const [isDetectionAnyConfidence, setIsDetectionAnyConfidence] = useState(false);

  // State for editing existing rules
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleData, setEditRuleData] = useState<{ confidence: number; anyConfidence: boolean }>({ confidence: 75, anyConfidence: false });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailSizes: ThumbnailSize[] = ['XS', 'S', 'M', 'L', 'XL'];

  const handleSave = () => {
    onSave(profile);
    closeModal();
  };

  const handleAddRule = (type: 'classification' | 'detection') => {
    if (type === 'classification') {
      if (!newClassificationRule.label.trim()) return;
      const ruleToAdd: FilterRule = {
        id: Date.now().toString(),
        label: newClassificationRule.label.trim(),
      };
      if (!isClassificationAnyConfidence) {
        ruleToAdd.confidence = newClassificationRule.confidence;
      }
      setProfile(p => ({
        ...p,
        classificationRules: [...p.classificationRules, ruleToAdd]
      }));
      setNewClassificationRule({ label: '', confidence: 75 });
      setIsClassificationAnyConfidence(false);
    } else {
      if (!newDetectionRule.label.trim()) return;
      const ruleToAdd: FilterRule = {
        id: Date.now().toString(),
        label: newDetectionRule.label.trim(),
      };
      if (!isDetectionAnyConfidence) {
        ruleToAdd.confidence = newDetectionRule.confidence;
      }
      setProfile(p => ({
        ...p,
        detectionRules: [...p.detectionRules, ruleToAdd]
      }));
      setNewDetectionRule({ label: '', confidence: 75 });
      setIsDetectionAnyConfidence(false);
    }
  };

  const handleRemoveRule = (id: string, type: 'classification' | 'detection') => {
    if (type === 'classification') {
      setProfile(p => ({...p, classificationRules: p.classificationRules.filter(rule => rule.id !== id)}));
    } else {
      setProfile(p => ({...p, detectionRules: p.detectionRules.filter(rule => rule.id !== id)}));
    }
  };

  const handleStartEdit = (rule: FilterRule) => {
    setEditingRuleId(rule.id);
    setEditRuleData({
      confidence: rule.confidence ?? 75,
      anyConfidence: rule.confidence === undefined,
    });
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
  };

  const handleSaveEdit = (type: 'classification' | 'detection') => {
    if (!editingRuleId) return;

    const ruleUpdater = (rules: FilterRule[]) => rules.map(rule => {
      if (rule.id === editingRuleId) {
        const updatedRule = { ...rule };
        if (editRuleData.anyConfidence) {
          delete updatedRule.confidence;
        } else {
          updatedRule.confidence = editRuleData.confidence;
        }
        return updatedRule;
      }
      return rule;
    });

    if (type === 'classification') {
      setProfile(p => ({ ...p, classificationRules: ruleUpdater(p.classificationRules) }));
    } else {
      setProfile(p => ({ ...p, detectionRules: ruleUpdater(p.detectionRules) }));
    }

    setEditingRuleId(null);
  };

  const handleExportProfile = () => {
    try {
      const profileJson = JSON.stringify(profile, null, 2);
      const blob = new Blob([profileJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixo_profile_${profile.firstName.toLowerCase().replace(/\s/g, '_')}.json`;
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

        if (importedProfile.rules && !importedProfile.classificationRules) {
          importedProfile.classificationRules = importedProfile.rules;
          delete importedProfile.rules;
        }
        if (!importedProfile.classificationRules) importedProfile.classificationRules = [];
        if (!importedProfile.detectionRules) importedProfile.detectionRules = [];

        const isValid = typeof importedProfile.firstName === 'string' &&
            Array.isArray(importedProfile.classificationRules) &&
            Array.isArray(importedProfile.detectionRules) &&
            typeof importedProfile.autoApplyRules === 'boolean';

        if (isValid) {
          const newProfileState: UserProfile = {
            ...currentProfile,
            ...importedProfile,
            unknownThreshold: importedProfile.unknownThreshold ?? 10,
            thumbnailSize: importedProfile.thumbnailSize ?? 'M'
          };
          setProfile(newProfileState);
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
        {/* General Settings */}
        <div>
          <label className="block font-semibold mb-1">First Name</label>
          <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary"/>
        </div>

        <div className="space-y-2">
          <label className="block font-semibold">Thumbnail Size</label>
          <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            {thumbnailSizes.map(size => (
                <button
                    key={size}
                    onClick={() => setProfile({ ...profile, thumbnailSize: size })}
                    className={`flex-1 p-2 rounded-md transition-colors text-sm font-semibold ${
                        (profile.thumbnailSize || 'M') === size
                            ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {size}
                </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={profile.autoApplyRules} onChange={e => setProfile({...profile, autoApplyRules: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary"/>
            <span>Automatically apply all rules on photo load</span>
          </label>
        </div>

        {/* Uncategorized Rule Section */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold">Uncategorized Rule (Classification-based)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If all AI **classification** scores for a photo are below this threshold, it will be classified as 'Uncategorized'. This helps filter out ambiguous images.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Confidence Threshold ({profile.unknownThreshold}%)</label>
            <input
                type="range"
                min="0"
                max="50"
                value={profile.unknownThreshold}
                onChange={e => setProfile({...profile, unknownThreshold: parseInt(e.target.value, 10)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
            />
          </div>
        </div>

        {/* Classification Rules Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-secondary"/> Classification Rules</h3>
          {profile.classificationRules.length === 0 && <p className="text-gray-500 text-sm">No classification rules defined. Add one below!</p>}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {profile.classificationRules.map(rule => (
                <div key={rule.id}>
                  {editingRuleId === rule.id ? (
                      <div className="p-3 bg-gray-200 dark:bg-gray-900 rounded-lg space-y-3 ring-2 ring-primary">
                        <div>
                          <label className="block text-sm font-medium mb-1">Confidence ({editRuleData.confidence}%)</label>
                          <input type="range" min="1" max="100" value={editRuleData.confidence} onChange={e => setEditRuleData({...editRuleData, confidence: parseInt(e.target.value)})} className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed" disabled={editRuleData.anyConfidence}/>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <input type="checkbox" checked={editRuleData.anyConfidence} onChange={e => setEditRuleData({...editRuleData, anyConfidence: e.target.checked})} className="w-4 h-4 rounded text-primary focus:ring-primary"/>
                          <span>Apply at any confidence</span>
                        </label>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={handleCancelEdit} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </button>
                          <button onClick={() => handleSaveEdit('classification')} className="p-2 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors">
                            <Check className="w-5 h-5 text-green-600" />
                          </button>
                        </div>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <span className="font-semibold px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">SELECT</span>
                        <span>if contains</span>
                        <span className="font-semibold text-primary">{`"${rule.label}"`}</span>
                        {rule.confidence !== undefined ? (
                            <>
                              <span>with confidence</span>
                              <span className="font-semibold text-primary">{`> ${rule.confidence}%`}</span>
                            </>
                        ) : (
                            <span className="font-semibold text-primary/90 ml-1">at any confidence</span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          <button onClick={() => handleStartEdit(rule)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button onClick={() => handleRemoveRule(rule.id, 'classification')} className="p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-600"/>
                          </button>
                        </div>
                      </div>
                  )}
                </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="font-semibold mb-2">Add New Classification Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <AutocompleteInput
                    placeholder="e.g., beach, forest"
                    value={newClassificationRule.label}
                    onChange={val => setNewClassificationRule({...newClassificationRule, label: val})}
                    suggestions={allAvailableClassificationLabels}
                />
              </div>
              <div className={`transition-opacity ${isClassificationAnyConfidence ? 'opacity-50' : ''}`}>
                <label className="block text-sm font-medium mb-1">Confidence ({newClassificationRule.confidence}%)</label>
                <input type="range" min="1" max="100" value={newClassificationRule.confidence} onChange={e => setNewClassificationRule({...newClassificationRule, confidence: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 disabled:cursor-not-allowed" disabled={isClassificationAnyConfidence}/>
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="checkbox" checked={isClassificationAnyConfidence} onChange={e => setIsClassificationAnyConfidence(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary"/>
                <span>Apply at any confidence</span>
              </label>
            </div>
            <button onClick={() => handleAddRule('classification')} className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition text-sm">
              <PlusCircle className="w-4 h-4"/> Add Classification Rule
            </button>
          </div>
        </div>

        {/* Detection Rules Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold flex items-center gap-2"><Boxes className="w-5 h-5 text-secondary"/> Object Detection Rules</h3>
          {profile.detectionRules.length === 0 && <p className="text-gray-500 text-sm">No detection rules defined. Add one below!</p>}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {profile.detectionRules.map(rule => (
                <div key={rule.id}>
                  {editingRuleId === rule.id ? (
                      <div className="p-3 bg-gray-200 dark:bg-gray-900 rounded-lg space-y-3 ring-2 ring-accent">
                        <div>
                          <label className="block text-sm font-medium mb-1">Confidence ({editRuleData.confidence}%)</label>
                          <input type="range" min="1" max="100" value={editRuleData.confidence} onChange={e => setEditRuleData({...editRuleData, confidence: parseInt(e.target.value)})} className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed" disabled={editRuleData.anyConfidence}/>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <input type="checkbox" checked={editRuleData.anyConfidence} onChange={e => setEditRuleData({...editRuleData, anyConfidence: e.target.checked})} className="w-4 h-4 rounded text-accent focus:ring-accent"/>
                          <span>Apply at any confidence</span>
                        </label>
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={handleCancelEdit} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </button>
                          <button onClick={() => handleSaveEdit('detection')} className="p-2 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors">
                            <Check className="w-5 h-5 text-green-600" />
                          </button>
                        </div>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <span className="font-semibold px-2 py-1 text-xs rounded-full bg-accent/20 text-accent">SELECT</span>
                        <span>if an object is</span>
                        <span className="font-semibold text-accent">{`"${rule.label}"`}</span>
                        {rule.confidence !== undefined ? (
                            <>
                              <span>with confidence</span>
                              <span className="font-semibold text-accent">{`> ${rule.confidence}%`}</span>
                            </>
                        ) : (
                            <span className="font-semibold text-accent/90 ml-1">at any confidence</span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          <button onClick={() => handleStartEdit(rule)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button onClick={() => handleRemoveRule(rule.id, 'detection')} className="p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-600"/>
                          </button>
                        </div>
                      </div>
                  )}
                </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="font-semibold mb-2">Add New Detection Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Object Label</label>
                <AutocompleteInput
                    placeholder="e.g., person, car, dog"
                    value={newDetectionRule.label}
                    onChange={val => setNewDetectionRule({...newDetectionRule, label: val})}
                    suggestions={allAvailableDetectionLabels}
                />
              </div>
              <div className={`transition-opacity ${isDetectionAnyConfidence ? 'opacity-50' : ''}`}>
                <label className="block text-sm font-medium mb-1">Confidence ({newDetectionRule.confidence}%)</label>
                <input type="range" min="1" max="100" value={newDetectionRule.confidence} onChange={e => setNewDetectionRule({...newDetectionRule, confidence: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 disabled:cursor-not-allowed" disabled={isDetectionAnyConfidence}/>
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="checkbox" checked={isDetectionAnyConfidence} onChange={e => setIsDetectionAnyConfidence(e.target.checked)} className="w-4 h-4 rounded text-accent focus:ring-accent"/>
                <span>Apply at any confidence</span>
              </label>
            </div>
            <button onClick={() => handleAddRule('detection')} className="mt-4 flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent-dark transition text-sm">
              <PlusCircle className="w-4 h-4"/> Add Detection Rule
            </button>
          </div>
        </div>

        {/* Footer Actions */}
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
