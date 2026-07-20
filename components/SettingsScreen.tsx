import React from 'react';
import { Settings } from '../types';
import { Button } from './Button';
import { exportData, importData } from '../lib/storageManager';

interface SettingsScreenProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    onBack: () => void;
}

interface SettingToggleProps {
    label: string;
    checked: boolean;
    onToggle: () => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({ label, checked, onToggle }) => (
    <div className="flex items-center justify-between gap-4 rounded-lg p-3 glassmorphism">
        <span className="text-sm text-gray-200 sm:text-lg">{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onToggle}
            className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 ${checked ? 'bg-cyan-500' : 'bg-gray-700'}`}
        >
            <span
                aria-hidden="true"
                className={`block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, setSettings, onBack }) => {
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        importData(file, () => {
            alert('Data byla úspěšně importována. Stránka se nyní obnoví.');
            window.location.reload();
        });
        event.target.value = '';
    };

    return (
        <div className="safe-screen absolute inset-0 z-20 flex flex-col items-center justify-start overflow-y-auto glassmorphism screen-enter md:justify-center">
            <h2 className="mt-4 mb-8 text-center text-3xl font-black text-white neon-text sm:text-5xl md:mt-0">NASTAVENÍ</h2>

            <div className="flex w-full max-w-md flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="volume" className="text-sm text-gray-200 sm:text-lg">
                        Hlasitost: {Math.round(settings.volume * 100)} %
                    </label>
                    <input
                        id="volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={settings.volume}
                        onChange={event => setSettings(current => ({ ...current, volume: Number(event.target.value) }))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-fuchsia-500"
                    />
                </div>

                <SettingToggle
                    label="Vibrace"
                    checked={settings.haptics}
                    onToggle={() => setSettings(current => ({ ...current, haptics: !current.haptics }))}
                />
                <SettingToggle
                    label="Chvění kamery"
                    checked={settings.cameraShake}
                    onToggle={() => setSettings(current => ({ ...current, cameraShake: !current.cameraShake }))}
                />
                <SettingToggle
                    label="Omezený pohyb"
                    checked={settings.reducedMotion}
                    onToggle={() => setSettings(current => ({ ...current, reducedMotion: !current.reducedMotion }))}
                />

                <div className="mt-2 flex flex-col gap-4 border-t border-gray-700 pt-5">
                    <Button onClick={exportData} variant="secondary">Exportovat postup</Button>
                    <label
                        htmlFor="import-file"
                        className="w-full cursor-pointer rounded-lg bg-transparent px-6 py-3 text-center text-base font-bold uppercase tracking-wider text-gray-300 transition-all duration-300 hover:bg-gray-700/50 hover:text-white focus-within:ring-2 focus-within:ring-gray-400 sm:text-lg"
                    >
                        Importovat postup
                        <input
                            id="import-file"
                            type="file"
                            accept="application/json,.json"
                            className="sr-only"
                            onChange={handleImport}
                        />
                    </label>
                </div>
            </div>

            <div className="mt-8 w-full max-w-md pb-2 md:mt-12">
                <Button onClick={onBack} variant="primary">Zpět do menu</Button>
            </div>
        </div>
    );
};
