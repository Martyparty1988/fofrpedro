import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Skin } from '../types';
import { Button } from './Button';
import { RealisticRunner } from './game3d/RealisticRunner';

interface SkinsScreenProps {
    skins: Skin[];
    selectedSkin: Skin;
    onSelectSkin: (skin: Skin) => void;
    onBack: () => void;
}

const PREVIEW_MODEL_POSITION: [number, number, number] = [0, -1.48, 0];

export const SkinsScreen: React.FC<SkinsScreenProps> = ({ skins, selectedSkin, onSelectSkin, onBack }) => (
    <div className="safe-screen absolute inset-0 z-20 flex flex-col items-center justify-start overflow-y-auto glassmorphism screen-enter md:justify-center">
        <h2 className="mt-4 mb-4 text-center text-3xl font-black text-white neon-text sm:text-5xl md:mt-0">VYBER VZHLED</h2>

        <div className="w-full max-w-3xl rounded-xl border border-white/10 glassmorphism">
            <div className="h-64 w-full sm:h-80">
                <Canvas
                    aria-label={`3D náhled vzhledu ${selectedSkin.name}`}
                    shadows
                    dpr={[1, 1.5]}
                    camera={{ fov: 38, position: [0, 0.65, 6.2] }}
                    gl={{ antialias: false, powerPreference: 'high-performance' }}
                    fallback={<div className="grid h-full place-items-center text-gray-400">3D náhled není dostupný.</div>}
                >
                    <color attach="background" args={['#060b14']} />
                    <hemisphereLight color="#b8d6ff" groundColor="#130d1d" intensity={1.4} />
                    <directionalLight castShadow position={[4, 7, 5]} intensity={2.8} color="#dcecff" />
                    <pointLight position={[-4, 2, 3]} intensity={22} color="#f0abfc" />
                    <pointLight position={[4, 1, -2]} intensity={18} color="#67e8f9" />
                    <RealisticRunner position={PREVIEW_MODEL_POSITION} scale={1} colors={selectedSkin.colors} motion="idle" />
                    <ContactShadows position={[0, -1.47, 0]} opacity={0.58} scale={8} blur={2.4} far={4.5} frames={1} />
                    <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[3.5, 48]} />
                        <meshStandardMaterial color="#101722" roughness={0.58} metalness={0.42} />
                    </mesh>
                    <OrbitControls
                        target={[0, 0.05, 0]}
                        enablePan={false}
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 1.8}
                        minDistance={4}
                        maxDistance={7}
                    />
                </Canvas>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-4 sm:grid-cols-3">
                {skins.map(skin => {
                    const isSelected = skin.id === selectedSkin.id;
                    return (
                        <button
                            key={skin.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onSelectSkin(skin)}
                            className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border-2 p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300 ${isSelected ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300' : 'border-white/10 text-white hover:border-gray-500'}`}
                        >
                            <span className="font-bold">{skin.name}</span>
                            <span className="flex shrink-0 gap-1" aria-hidden="true">
                                {Object.values(skin.colors).map(color => (
                                    <span key={color} className="h-5 w-5 rounded-full border border-white/30" style={{ backgroundColor: color }} />
                                ))}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="mt-6 w-full max-w-md pb-2 md:mt-8">
            <Button onClick={onBack} variant="primary">Zpět do menu</Button>
        </div>
    </div>
);
