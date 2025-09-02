import React from 'react';
import { Skin } from '../types';
import { Button } from './Button';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { PlayerModel } from '../constants/assets';

interface SkinsScreenProps {
    skins: Skin[];
    selectedSkin: Skin;
    onSelectSkin: (skin: Skin) => void;
    onBack: () => void;
}

export const SkinsScreen: React.FC<SkinsScreenProps> = ({ skins, selectedSkin, onSelectSkin, onBack }) => {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center glassmorphism p-4 fade-in">
            <h2 className="text-5xl font-black text-white neon-text mb-2">CHOOSE YOUR SKIN</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl p-4">
                {skins.map(skin => {
                    const isSelected = skin.id === selectedSkin.id;
                    return (
                        <div 
                            key={skin.id} 
                            onClick={() => onSelectSkin(skin)}
                            className={`glassmorphism rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all duration-300 border-2 ${isSelected ? 'border-fuchsia-500 shadow-lg shadow-fuchsia-500/20' : 'border-transparent hover:border-gray-600'}`}
                        >
                            <div className="w-full h-48 md:h-64">
                                <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
                                    <Stage environment="city" intensity={0.6}>
                                        <PlayerModel scale={2} colors={skin.colors} />
                                    </Stage>
                                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2}/>
                                </Canvas>
                            </div>
                            <h3 className={`mt-4 text-2xl font-bold ${isSelected ? 'text-fuchsia-400' : 'text-white'}`}>{skin.name}</h3>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 w-full max-w-md">
                 <Button onClick={onBack} variant="primary">Back to Menu</Button>
            </div>
        </div>
    );
};