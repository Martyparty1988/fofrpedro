import React from 'react';
import { Settings } from '../types';
import { Button } from './Button';
import { exportData, importData } from '../lib/storageManager';

interface SettingsScreenProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, setSettings, onBack }) => {
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importData(file, () => {
                alert('Data imported successfully! The page will now reload.');
                window.location.reload();
            });
        }
    };
    
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center glassmorphism p-4 fade-in">
            <h2 className="text-5xl font-black text-white neon-text mb-8">SETTINGS</h2>
            
            <div className="w-full max-w-md flex flex-col gap-6">
                {/* Volume */}
                <div className="flex flex-col gap-2">
                    <label className="text-lg text-gray-300">Volume: {Math.round(settings.volume * 100)}%</label>
                    <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={settings.volume}
                        onChange={(e) => setSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                    />
                </div>
                
                {/* Toggles */}
                <div className="flex justify-between items-center glassmorphism p-3 rounded-lg">
                    <span className="text-lg text-gray-300">Haptic Feedback</span>
                    <button 
                        onClick={() => setSettings(s => ({...s, haptics: !s.haptics}))}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.haptics ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.haptics ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>
                
                 <div className="flex justify-between items-center glassmorphism p-3 rounded-lg">
                    <span className="text-lg text-gray-300">Camera Shake</span>
                    <button 
                        onClick={() => setSettings(s => ({...s, cameraShake: !s.cameraShake}))}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.cameraShake ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.cameraShake ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                <div className="flex justify-between items-center glassmorphism p-3 rounded-lg">
                    <span className="text-lg text-gray-300">Reduced Motion</span>
                    <button 
                        onClick={() => setSettings(s => ({...s, reducedMotion: !s.reducedMotion}))}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.reducedMotion ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Data Management */}
                <div className="mt-4 border-t border-gray-700 pt-6 flex flex-col gap-4">
                     <Button onClick={exportData} variant="secondary">Export Progress</Button>
                     <label htmlFor="import-file" className="w-full">
                        <span className="block w-full text-center px-6 py-3 text-lg font-bold tracking-wider uppercase rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black bg-transparent text-gray-300 hover:text-white hover:bg-gray-700/50 focus:ring-gray-400 cursor-pointer">
                            Import Progress
                        </span>
                        <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />
                     </label>
                </div>
            </div>

            <div className="mt-12 w-full max-w-md">
                 <Button onClick={onBack} variant="primary">Back to Menu</Button>
            </div>
        </div>
    );
};