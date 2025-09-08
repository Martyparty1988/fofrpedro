import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEffect } from '../../types';

// A more generic particle effect component
const ParticleBurst: React.FC<{
    position: [number, number, number];
    count: number;
    color: THREE.Color | string;
    size: number;
    duration: number;
    speed: number;
}> = ({ position, count, color, size, duration, speed }) => {
    const particles = useMemo(() => {
        return Array.from({ length: count }, () => ({
            ref: React.createRef<THREE.Mesh>(),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            ),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            ),
        }));
    }, [count, speed]);

    const groupRef = useRef<THREE.Group>(null!);
    const life = useRef(0);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        life.current += delta;
        const progress = Math.min(life.current / duration, 1);

        if (progress >= 1) {
            groupRef.current.visible = false;
            return;
        }

        const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        particles.forEach(p => {
            if (p.ref.current) {
                p.ref.current.position.addScaledVector(p.velocity, delta);
                p.ref.current.rotation.x += p.rotationSpeed.x * delta;
                p.ref.current.rotation.y += p.rotationSpeed.y * delta;

                const scale = Math.max(0, 1 - easedProgress);
                p.ref.current.scale.set(scale * size, scale * size, scale * size);

                (p.ref.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - progress * 1.5);
            }
        });
    });

    return (
        <group ref={groupRef} position={position}>
            {particles.map((p, i) => (
                <mesh key={i} ref={p.ref}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={5}
                        transparent
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
};


interface EffectsManagerProps {
    effects: GameEffect[];
}

export const EffectsManager: React.FC<EffectsManagerProps> = ({ effects }) => {
    return (
        <group>
            {effects.map(effect => {
                switch (effect.type) {
                    case 'lajna-collect':
                        return <ParticleBurst key={effect.id} position={effect.position} color={"#ffffff"} count={8} size={0.1} duration={0.4} speed={5} />;
                    case 'cevko-collect':
                        return <ParticleBurst key={effect.id} position={effect.position} color={"#a855f7"} count={8} size={0.15} duration={0.4} speed={5} />;
                    case 'powerup-collect':
                         return <ParticleBurst key={effect.id} position={effect.position} color={"#fde047"} count={30} size={0.25} duration={0.8} speed={15} />;
                    case 'damage':
                         return <ParticleBurst key={effect.id} position={effect.position} color={"#ff4400"} count={20} size={0.2} duration={0.6} speed={12} />;
                    default:
                        return null;
                }
            })}
        </group>
    );
};