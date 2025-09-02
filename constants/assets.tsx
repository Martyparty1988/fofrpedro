import React from 'react';
import { Skin } from '../types';
import * as THREE from 'three';

// --- SVG Icons ---
export const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

export const SpeedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13 2.05v3.03c4.39.54 7.5 4.53 6.96 8.92-.46 3.8-3.35 6.92-7.01 7.23v3.02c5.5-.55 9.5-5.43 8.95-10.93-.45-4.75-4.22-8.5-8.9-8.95zM5.05 5.76C3.39 7.42 2.5 9.61 2.5 12s.89 4.58 2.55 6.24l1.41-1.41C4.89 15.76 4.5 13.95 4.5 12s.39-3.76 1.46-4.83L5.05 5.76z" />
    </svg>
);

export const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
);

export const FlipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" />
    </svg>
);

export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

export const SlideIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2 7h20v2H2V7zm10 4l-4 4h3v4h2v-4h3l-4-4z"/>
    </svg>
);


// --- 3D Skin Models ---

interface PlayerModelProps {
  colors: Skin['colors'];
  [key: string]: any;
}

export const PlayerModel: React.FC<PlayerModelProps> = ({ colors, ...props }) => {
    return (
        <group {...props}>
            {/* Body */}
            <mesh castShadow position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.4, 1, 4, 16]} />
                <meshStandardMaterial color={colors.body} />
            </mesh>
            {/* Head */}
            <mesh castShadow position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color="#f0e68c" />
            </mesh>
             {/* Hat */}
            <mesh castShadow position={[0, 2.1, 0]} rotation={[0,0,0.2]}>
                <cylinderGeometry args={[0.5, 0.55, 0.3, 16]} />
                <meshStandardMaterial color={colors.hat} />
            </mesh>
             {/* Backpack */}
            <mesh castShadow position={[0, 1, -0.4]}>
                <boxGeometry args={[0.7, 0.9, 0.4]} />
                <meshStandardMaterial color={colors.backpack} />
            </mesh>
        </group>
    );
};


export const SKINS: Skin[] = [
    { 
        id: 'piko-pete', 
        name: 'Piko Pete', 
        colors: { hat: '#a78bfa', backpack: '#475569', body: '#374151' }
    },
    { 
        id: 'piko-punk', 
        name: 'Piko Punk', 
        colors: { hat: '#7dd3fc', backpack: '#111827', body: '#1f2937' }
    },
    { 
        id: 'golden-piko', 
        name: 'Golden Piko', 
        colors: { hat: '#22c55e', backpack: '#d1d5db', body: '#ca8a04' }
    },
];