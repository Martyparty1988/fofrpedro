import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState, Settings, Skin } from '../../types';
import { Player3D } from '../Player3D';
import { Road } from '../Road';
import { Environment } from './Environment';
import { GameItems } from './GameItems';
import { EffectsManager } from './EffectsManager';
import { Rain } from './Rain';

interface GameScene3DProps {
    gameState: GameState;
    settings: Settings;
    skin: Skin;
}

const CAMERA_OFFSET = new THREE.Vector3(0, 5, 10);
const SHAKE_INTENSITY = 0.3;

export const GameScene3D: React.FC<GameScene3DProps> = ({ gameState, settings, skin }) => {
    const cameraShake = useRef(0);
    const lastHealth = useRef(gameState.player.health);
    const fogRef = useRef<THREE.Fog>(null!);
    
    useFrame((state) => {
        // Smooth camera follow logic
        const targetX = gameState.player.lane * 4;
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.1);
        state.camera.position.y = CAMERA_OFFSET.y;
        state.camera.position.z = CAMERA_OFFSET.z;
        state.camera.lookAt(targetX, 2, 0);

        // Camera shake logic
        if (gameState.player.health < lastHealth.current && settings.cameraShake) {
            cameraShake.current = 1.0;
        }
        lastHealth.current = gameState.player.health;
        
        if (cameraShake.current > 0) {
            cameraShake.current -= 0.05;
            state.camera.position.x += (Math.random() - 0.5) * SHAKE_INTENSITY * cameraShake.current;
            state.camera.position.y += (Math.random() - 0.5) * SHAKE_INTENSITY * cameraShake.current;
        }

        // Dynamic fog
        if (fogRef.current) {
            const minFog = 40;
            const maxFog = 80;
            // Normalize speed from its min/max range (15-50) to a 0-1 range
            const normalizedSpeed = (gameState.gameSpeed - 15) / (50 - 15);
            // Lerp fog distance. As speed increases, fog gets closer.
            fogRef.current.far = THREE.MathUtils.lerp(maxFog, minFog, normalizedSpeed);
        }
    });

    return (
        <>
            <ambientLight intensity={0.2} />
            <directionalLight
                castShadow
                position={[10, 20, 5]}
                intensity={0.8}
                color="#6495ED"
                shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-20, 4, 0]} color="#ff00ff" intensity={30} distance={50} />
            <pointLight position={[20, 4, 0]} color="#00ffff" intensity={30} distance={50} />

            <fog ref={fogRef} attach="fog" args={['#000000', 10, 70]} />
            
            <Player3D playerState={gameState.player} skin={skin} powerUps={gameState.activePowerUps} settings={settings} />
            <GameItems gameObjects={gameState.gameObjects} />
            <Road speed={gameState.gameSpeed} />
            <Environment speed={gameState.gameSpeed} />
            <EffectsManager effects={gameState.effects} />
            <Rain speed={gameState.gameSpeed} />
            <gridHelper args={[1000, 250, '#ff00ff', '#444444']} position={[0, -0.01, 0]} visible={false} />
        </>
    );
};