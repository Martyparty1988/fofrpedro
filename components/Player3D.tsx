import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerState, Skin, PowerUpState, GameObjectType, Settings } from '../types';
import { PlayerModel } from '../constants/assets';

interface Player3DProps {
    playerState: PlayerState;
    skin: Skin;
    powerUps: PowerUpState[];
    settings: Settings;
}

// Animation constants for easy tweaking
const FLIP_JUMP_HEIGHT = 3.5;
const FLIP_ROTATION_SPEED = -Math.PI * 2;
const HOP_JUMP_HEIGHT = 2.5;
const SLIDE_HEIGHT_OFFSET = -0.4;
const SLIDE_ROTATION = Math.PI / 2;


// A smooth easing function (quintic in-out)
const easeInOutQuint = (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

export const Player3D: React.FC<Player3DProps> = ({ playerState, skin, powerUps, settings }) => {
    // This ref controls the group's position (lane switching, jumping)
    const groupRef = useRef<THREE.Group>(null!);
    // This ref controls the model's rotation and scale, independent of its position
    const playerModelRef = useRef<THREE.Group>(null!);
    const shieldRef = useRef<THREE.Mesh>(null!);
    const speedTrailRef = useRef<THREE.Mesh>(null!);
    const invincibilityLightRef = useRef<THREE.PointLight>(null!);
    const speedLightRef = useRef<THREE.PointLight>(null!);


    const isInvincible = useMemo(() => powerUps.some(p => p.type === GameObjectType.Invincibility), [powerUps]);
    const isSpeedBoosted = useMemo(() => powerUps.some(p => p.type === GameObjectType.SpeedBoost), [powerUps]);

    useFrame(({ clock }) => {
        if (!groupRef.current || !playerModelRef.current) return;
        
        // Smooth lane switching
        const targetX = playerState.lane * 4;
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.2);

        // --- DYNAMIC FLIP & HOP ANIMATIONS ---
        if (playerState.isFlipping) {
            const progress = playerState.flipProgress;

            // The formula 4 * x * (1 - x) creates a parabolic arc that goes from 0 up to 1 (at x=0.5) and back down to 0.
            // This is perfect for simulating jump physics.
            const jumpArc = 4 * progress * (1 - progress);

            if (settings.reducedMotion) {
                // Smoother hop with parabolic arc for reduced motion
                groupRef.current.position.y = 1 + jumpArc * HOP_JUMP_HEIGHT;
                playerModelRef.current.rotation.x = 0; // Ensure no rotation
            } else {
                // Dynamic acrobatic front flip
                const easedProgress = easeInOutQuint(progress);
                
                // Apply rotation to the model itself
                playerModelRef.current.rotation.x = easedProgress * FLIP_ROTATION_SPEED;
                
                // Apply vertical motion to the parent group
                groupRef.current.position.y = 1 + jumpArc * FLIP_JUMP_HEIGHT;
            }
        } else if (playerState.isSliding) {
            const progress = playerState.slideProgress;
            // Parabolic arc for smooth entry/exit of the slide motion
            const slideArc = 4 * progress * (1 - progress);

            // Lower the player and rotate them
            groupRef.current.position.y = 1 + SLIDE_HEIGHT_OFFSET * slideArc;
            playerModelRef.current.rotation.x = SLIDE_ROTATION * slideArc;
        } else {
            // Lerp back to original position/rotation when not doing any action
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 1, 0.2);
            playerModelRef.current.rotation.x = THREE.MathUtils.lerp(playerModelRef.current.rotation.x, 0, 0.2);
        }
        
        // Shield pulse animation
        if (isInvincible && shieldRef.current && invincibilityLightRef.current) {
            const pulse = Math.sin(clock.elapsedTime * 8);
            const scale = 1.1 + pulse * 0.15;
            shieldRef.current.scale.set(scale, scale, scale);
            const opacity = 0.4 + pulse * 0.2;
            (shieldRef.current.material as THREE.MeshStandardMaterial).opacity = opacity;

            // Light pulse
            invincibilityLightRef.current.intensity = 20 + pulse * 10;
        }
        
        // Speed trail animation
        if (isSpeedBoosted && speedTrailRef.current && speedLightRef.current) {
             const pulse = Math.sin(clock.elapsedTime * 10);
             const scale = 1 + pulse * 0.1;
             speedTrailRef.current.scale.z = scale;
             speedTrailRef.current.scale.x = 1.2 - (scale - 1);
             speedTrailRef.current.scale.y = 1.2 - (scale - 1);
             (speedTrailRef.current.material as THREE.MeshStandardMaterial).opacity = 0.4 + pulse * 0.2;

             // Light flicker
             speedLightRef.current.intensity = 25 + Math.random() * 10;
        }
    });
    
    return (
        <group ref={groupRef} position={[0, 1, 0]}>
            {/* The inner group is used for rotation, so it pivots around its center */}
            <group ref={playerModelRef} rotation={[0, Math.PI, 0]}>
                 <PlayerModel scale={1} colors={skin.colors} />
            </group>

            {/* Lights for powerups */}
            <pointLight ref={invincibilityLightRef} position={[0, 1, 0]} color="#00ffff" distance={20} intensity={0} visible={isInvincible} />
            <pointLight ref={speedLightRef} position={[0, 1, 0]} color="#fde047" distance={20} intensity={0} visible={isSpeedBoosted} />

            {/* Power-up effects are attached to the main group */}
            {isInvincible && (
                <mesh ref={shieldRef} >
                    <sphereGeometry args={[1.6, 32, 32]} />
                    <meshStandardMaterial 
                        color="#00ffff" 
                        transparent 
                        opacity={0.5} 
                        emissive="#00ffff" 
                        emissiveIntensity={3} 
                        side={THREE.FrontSide}
                        depthWrite={false}
                    />
                </mesh>
            )}
             {isSpeedBoosted && (
                <mesh ref={speedTrailRef} position={[0, 0.5, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.5, 5, 8]} />
                     <meshStandardMaterial 
                        color="#fde047" 
                        transparent 
                        opacity={0.6} 
                        emissive="#fde047" 
                        emissiveIntensity={4} 
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
};