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
    quality: SceneQuality;
}

export type SceneQuality = 'high' | 'balanced' | 'low';

const CAMERA_HEIGHT = 4.45;
const CAMERA_DISTANCE = 9.5;
const SHAKE_INTENSITY = 0.24;
const CAMERA_FOLLOW_RATIO = 0.12;
const CAMERA_AIM_RATIO = 0.22;
const REDUCED_MOTION_FOLLOW_RATIO = 0.06;
const REDUCED_MOTION_AIM_RATIO = 0.12;

export const GameScene3D: React.FC<GameScene3DProps> = ({ gameState, settings, skin, quality }) => {
    const cameraShake = useRef(0);
    const cameraAimX = useRef(0);
    const lastHealth = useRef(gameState.player.health);
    const fogRef = useRef<THREE.Fog>(null!);
    const sceneSpeed = gameState.status === 'playing' ? gameState.gameSpeed : 0;
    
    useFrame((state, delta) => {
        const targetX = gameState.player.positionX;
        const positionDamping = 1 - Math.exp(-4.5 * delta);
        const aimDamping = 1 - Math.exp(-6 * delta);
        const followRatio = settings.reducedMotion ? REDUCED_MOTION_FOLLOW_RATIO : CAMERA_FOLLOW_RATIO;
        const aimRatio = settings.reducedMotion ? REDUCED_MOTION_AIM_RATIO : CAMERA_AIM_RATIO;
        const cameraTargetX = targetX * followRatio;
        const aimTargetX = targetX * aimRatio;
        const cameraBob = gameState.status === 'playing' && !settings.reducedMotion
            ? Math.sin(state.clock.elapsedTime * 6) * 0.018
            : 0;
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, cameraTargetX, positionDamping);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, CAMERA_HEIGHT + cameraBob, positionDamping);
        state.camera.position.z = CAMERA_DISTANCE;
        cameraAimX.current = THREE.MathUtils.lerp(cameraAimX.current, aimTargetX, aimDamping);

        if (gameState.player.health < lastHealth.current && settings.cameraShake) {
            cameraShake.current = 1.0;
        }
        lastHealth.current = gameState.player.health;
        
        if (cameraShake.current > 0) {
            cameraShake.current = Math.max(0, cameraShake.current - 3 * delta);
            state.camera.position.x += (Math.random() - 0.5) * SHAKE_INTENSITY * cameraShake.current;
            state.camera.position.y += (Math.random() - 0.5) * SHAKE_INTENSITY * cameraShake.current;
        }

        state.camera.lookAt(cameraAimX.current, 1.55, -4);
        // A locked horizon keeps lane changes readable and prevents motion sickness.
        state.camera.rotation.z = 0;

        if (fogRef.current) {
            const normalizedSpeed = THREE.MathUtils.clamp((gameState.gameSpeed - 15) / 35, 0, 1);
            fogRef.current.far = THREE.MathUtils.lerp(105, 72, normalizedSpeed);
        }
    });

    return (
        <>
            <color attach="background" args={['#02050c']} />
            <hemisphereLight color="#8fb7d4" groundColor="#08050f" intensity={0.9} />
            <ambientLight intensity={0.08} />
            <directionalLight
                castShadow={quality !== 'low'}
                position={[-14, 24, 10]}
                intensity={1.75}
                color="#b8d6ff"
                shadow-mapSize={quality === 'high' ? [1024, 1024] : [512, 512]}
                shadow-camera-left={-16}
                shadow-camera-right={16}
                shadow-camera-top={18}
                shadow-camera-bottom={-6}
                shadow-camera-near={1}
                shadow-camera-far={55}
            />
            <spotLight position={[0, 12, 7]} color="#d8ecff" intensity={42} angle={0.48} penumbra={0.85} distance={42} />
            <pointLight position={[-6.8, 5.2, -4]} color="#ff65c3" intensity={24} distance={28} decay={2} />
            <pointLight position={[6.8, 5.2, -18]} color="#70e1f5" intensity={26} distance={30} decay={2} />
            {quality !== 'low' && <pointLight position={[-6.8, 5.2, -36]} color="#70e1f5" intensity={20} distance={26} decay={2} />}

            <fog ref={fogRef} attach="fog" args={['#07101a', 26, 105]} />

            <group position={[25, 31, -76]}>
                <mesh>
                    <sphereGeometry args={[4.6, 32, 20]} />
                    <meshBasicMaterial color="#bcd7e8" toneMapped={false} />
                </mesh>
                <mesh position={[-1.2, 0.9, 4.15]} scale={[0.7, 0.5, 0.15]}>
                    <sphereGeometry args={[1, 16, 10]} />
                    <meshBasicMaterial color="#8ea9bb" />
                </mesh>
            </group>
            
            <Road speed={sceneSpeed} quality={quality} />
            <Environment speed={sceneSpeed} quality={quality} />
            <Player3D
                playerState={gameState.player}
                skin={skin}
                powerUps={gameState.activePowerUps}
                settings={settings}
                active={gameState.status === 'playing'}
                crashed={gameState.status === 'gameOver'}
            />
            <GameItems gameObjects={gameState.gameObjects} />
            <EffectsManager effects={gameState.effects} />
            {!settings.reducedMotion && <Rain speed={sceneSpeed} quality={quality} />}
        </>
    );
};
