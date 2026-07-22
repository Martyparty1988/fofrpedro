import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameEffect } from '../../types';

const ParticleBurst: React.FC<{
    position: [number, number, number];
    count: number;
    color: string;
    size: number;
    duration: number;
    speed: number;
}> = ({ position, count, color, size, duration, speed }) => {
    const pointsRef = useRef<THREE.Points>(null!);
    const materialRef = useRef<THREE.PointsMaterial>(null!);
    const life = useRef(0);
    const { positions, velocities } = useMemo(() => {
        const nextPositions = new Float32Array(count * 3);
        const nextVelocities = new Float32Array(count * 3);
        for (let index = 0; index < count; index++) {
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() * 0.8 + 0.15,
                Math.random() - 0.5,
            ).normalize().multiplyScalar(speed * (0.55 + Math.random() * 0.7));
            nextVelocities.set(direction.toArray(), index * 3);
        }
        return { positions: nextPositions, velocities: nextVelocities };
    }, [count, speed]);

    useFrame((_, delta) => {
        if (!pointsRef.current || !materialRef.current) return;
        life.current += delta;
        const progress = Math.min(1, life.current / duration);
        for (let index = 0; index < count; index++) {
            positions[index * 3] += velocities[index * 3] * delta;
            positions[index * 3 + 1] += velocities[index * 3 + 1] * delta - 3.2 * delta * delta;
            positions[index * 3 + 2] += velocities[index * 3 + 2] * delta;
            velocities[index * 3 + 1] -= 4.8 * delta;
        }
        const attribute = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
        attribute.needsUpdate = true;
        materialRef.current.opacity = Math.max(0, 1 - progress);
        materialRef.current.size = size * Math.max(0.15, 1 - progress * 0.7);
        pointsRef.current.visible = progress < 1;
    });

    return (
        <points ref={pointsRef} position={position} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial
                ref={materialRef}
                color={color}
                size={size}
                sizeAttenuation
                transparent
                opacity={1}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
};

export const EffectsManager: React.FC<{ effects: GameEffect[] }> = ({ effects }) => (
    <group>
        {effects.map(effect => {
            switch (effect.type) {
                case 'lajna-collect':
                    return <ParticleBurst key={effect.id} position={effect.position} color="#ffffff" count={10} size={0.18} duration={0.45} speed={4.5} />;
                case 'cevko-collect':
                    return <ParticleBurst key={effect.id} position={effect.position} color="#c084fc" count={12} size={0.22} duration={0.45} speed={5} />;
                case 'powerup-collect':
                    return <ParticleBurst key={effect.id} position={effect.position} color="#fde047" count={30} size={0.28} duration={0.8} speed={10} />;
                case 'obstacle-destroy':
                    return <ParticleBurst key={effect.id} position={effect.position} color="#fb923c" count={24} size={0.26} duration={0.65} speed={8} />;
                case 'damage':
                    return <ParticleBurst key={effect.id} position={effect.position} color="#ff3d00" count={28} size={0.3} duration={0.72} speed={9} />;
                default:
                    return null;
            }
        })}
    </group>
);
