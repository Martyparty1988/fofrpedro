import React, { memo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GameObject, GameObjectType } from '../../types';
import { isObstacleType } from '../../lib/gameRules';

const PickupShell: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
    <group>
        <mesh>
            <sphereGeometry args={[0.72, 20, 14]} />
            <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.62, 0.025, 8, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.65} toneMapped={false} />
        </mesh>
        {children}
    </group>
);

const Lajna = () => (
    <PickupShell color="#f8fafc">
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.09, 0.75, 6, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#dbeafe" emissiveIntensity={3.5} roughness={0.18} toneMapped={false} />
        </mesh>
    </PickupShell>
);

const Cevko = () => (
    <PickupShell color="#c084fc">
        <RoundedBox args={[0.62, 0.7, 0.32]} radius={0.1} smoothness={3} castShadow>
            <meshStandardMaterial color="#5b217e" emissive="#a855f7" emissiveIntensity={1.3} roughness={0.38} metalness={0.26} />
        </RoundedBox>
        <mesh position={[0, 0, 0.18]}>
            <boxGeometry args={[0.12, 0.42, 0.035]} />
            <meshBasicMaterial color="#f5d0fe" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.4, 0.12, 0.035]} />
            <meshBasicMaterial color="#f5d0fe" toneMapped={false} />
        </mesh>
    </PickupShell>
);

const SpeedBoost = () => (
    <PickupShell color="#38bdf8">
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.11, 10, 40]} />
            <meshStandardMaterial color="#082f49" emissive="#38bdf8" emissiveIntensity={3.2} metalness={0.72} roughness={0.2} toneMapped={false} />
        </mesh>
        {[0, 1, 2].map(index => (
            <mesh key={index} rotation={[0, 0, index * Math.PI * 2 / 3]}>
                <boxGeometry args={[0.12, 0.68, 0.08]} />
                <meshBasicMaterial color="#bae6fd" toneMapped={false} />
            </mesh>
        ))}
    </PickupShell>
);

const Invincibility = () => (
    <PickupShell color="#22d3ee">
        <mesh castShadow>
            <icosahedronGeometry args={[0.46, 1]} />
            <meshPhysicalMaterial color="#083344" emissive="#22d3ee" emissiveIntensity={2.4} metalness={0.68} roughness={0.18} clearcoat={1} toneMapped={false} />
        </mesh>
        <mesh scale={1.08}>
            <icosahedronGeometry args={[0.46, 1]} />
            <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.72} toneMapped={false} />
        </mesh>
    </PickupShell>
);

const Policajt = () => (
    <group>
        <mesh castShadow position={[0, 1.28, 0]} scale={[0.86, 1, 0.66]}>
            <capsuleGeometry args={[0.42, 1.05, 6, 16]} />
            <meshStandardMaterial color="#172554" roughness={0.68} metalness={0.12} />
        </mesh>
        <mesh position={[0, 1.48, 0.38]}>
            <boxGeometry args={[0.7, 0.14, 0.05]} />
            <meshStandardMaterial color="#dbeafe" emissive="#60a5fa" emissiveIntensity={0.8} />
        </mesh>
        {[-0.2, 0.2].map(x => (
            <group key={x} position={[x, 0.66, 0]}>
                <mesh castShadow position={[0, -0.25, 0]}>
                    <capsuleGeometry args={[0.14, 0.44, 5, 10]} />
                    <meshStandardMaterial color="#111827" roughness={0.84} />
                </mesh>
                <mesh castShadow position={[0, -0.58, 0.12]}>
                    <boxGeometry args={[0.3, 0.18, 0.52]} />
                    <meshStandardMaterial color="#05070c" roughness={0.48} />
                </mesh>
            </group>
        ))}
        {[-0.52, 0.52].map((x, index) => (
            <group key={x} position={[x, 1.62, 0]} rotation={[index ? -0.34 : 0.34, 0, index ? -0.14 : 0.14]}>
                <mesh castShadow position={[0, -0.3, 0]}>
                    <capsuleGeometry args={[0.13, 0.46, 5, 10]} />
                    <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
                </mesh>
            </group>
        ))}
        <mesh castShadow position={[0, 2.28, 0]}>
            <sphereGeometry args={[0.34, 20, 16]} />
            <meshStandardMaterial color="#c98f70" roughness={0.66} />
        </mesh>
        <group position={[0, 2.53, 0]}>
            <mesh castShadow>
                <cylinderGeometry args={[0.31, 0.38, 0.22, 20]} />
                <meshStandardMaterial color="#172554" roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.04, 0.28]}>
                <boxGeometry args={[0.52, 0.08, 0.26]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.55} />
            </mesh>
        </group>
        <mesh position={[0.3, 1.7, 0.4]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.1} metalness={0.9} roughness={0.2} />
        </mesh>
    </group>
);

const Auto = () => (
    <group>
        <RoundedBox args={[2.5, 0.72, 4.8]} radius={0.22} smoothness={4} position={[0, 0.64, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#9f1239" roughness={0.24} metalness={0.72} clearcoat={0.8} clearcoatRoughness={0.16} />
        </RoundedBox>
        <RoundedBox args={[2.1, 0.76, 2.15]} radius={0.18} smoothness={4} position={[0, 1.24, -0.55]} castShadow>
            <meshPhysicalMaterial color="#07111f" roughness={0.12} metalness={0.6} clearcoat={1} />
        </RoundedBox>
        <mesh position={[0, 1.58, -0.55]}>
            <boxGeometry args={[1.2, 0.12, 0.34]} />
            <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.24} />
        </mesh>
        {[-0.8, 0.8].map(x => (
            <mesh key={`light-${x}`} position={[x, 0.7, 2.42]}>
                <boxGeometry args={[0.5, 0.22, 0.06]} />
                <meshBasicMaterial color="#fef3c7" toneMapped={false} />
            </mesh>
        ))}
        {[-0.62, 0.62].map((x, index) => (
            <mesh key={`beacon-${x}`} position={[x, 1.72, -0.55]}>
                <cylinderGeometry args={[0.14, 0.16, 0.18, 16]} />
                <meshStandardMaterial color={index ? '#ef4444' : '#3b82f6'} emissive={index ? '#ef4444' : '#3b82f6'} emissiveIntensity={4} toneMapped={false} />
            </mesh>
        ))}
        {[-1.25, 1.25].flatMap(x => [-1.5, 1.5].map(z => (
            <mesh key={`${x}-${z}`} position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.34, 0.34, 0.24, 18]} />
                <meshStandardMaterial color="#05070b" roughness={0.76} />
            </mesh>
        )))}
    </group>
);

const Barikada = () => (
    <group>
        {[-1.15, 1.15].map(x => (
            <group key={x} position={[x, 0, 0]}>
                <mesh castShadow position={[0, 0.48, 0]}>
                    <coneGeometry args={[0.28, 0.96, 20]} />
                    <meshStandardMaterial color="#f97316" roughness={0.56} />
                </mesh>
                <mesh position={[0, 0.5, 0]}>
                    <torusGeometry args={[0.23, 0.035, 8, 24]} />
                    <meshBasicMaterial color="#fff7ed" toneMapped={false} />
                </mesh>
            </group>
        ))}
        <RoundedBox args={[2.75, 0.58, 0.18]} radius={0.08} smoothness={2} position={[0, 0.92, 0]} castShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.42} />
        </RoundedBox>
        {[-0.95, -0.35, 0.25, 0.85].map(x => (
            <mesh key={x} position={[x, 0.92, 0.11]} rotation={[0, 0, -0.58]}>
                <boxGeometry args={[0.18, 0.72, 0.035]} />
                <meshBasicMaterial color="#f97316" toneMapped={false} />
            </mesh>
        ))}
        {[-1.15, 1.15].map(x => (
            <mesh key={`warning-${x}`} position={[x, 1.36, 0]}>
                <sphereGeometry args={[0.11, 12, 8]} />
                <meshBasicMaterial color="#ef4444" toneMapped={false} />
            </mesh>
        ))}
    </group>
);

const Leseni = () => (
    <group>
        {[-1.5, 1.5].map(x => (
            <mesh key={x} position={[x, 1.35, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.08, 2.7, 10]} />
                <meshStandardMaterial color="#64748b" roughness={0.32} metalness={0.82} />
            </mesh>
        ))}
        <mesh position={[0, 2.58, 0]} castShadow>
            <boxGeometry args={[3.25, 0.16, 0.34]} />
            <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.74} />
        </mesh>
        <RoundedBox args={[2.75, 0.72, 0.16]} radius={0.08} smoothness={2} position={[0, 2.15, 0]} castShadow>
            <meshStandardMaterial color="#facc15" roughness={0.45} />
        </RoundedBox>
        {[-0.9, -0.3, 0.3, 0.9].map(x => (
            <mesh key={x} position={[x, 2.15, 0.1]} rotation={[0, 0, -0.55]}>
                <boxGeometry args={[0.18, 0.85, 0.03]} />
                <meshBasicMaterial color="#111827" toneMapped={false} />
            </mesh>
        ))}
        <mesh position={[0, 1.72, 0.13]}>
            <boxGeometry args={[1.1, 0.2, 0.04]} />
            <meshBasicMaterial color="#fb7185" toneMapped={false} />
        </mesh>
    </group>
);

const visuals: Record<GameObjectType, React.FC> = {
    [GameObjectType.Lajna]: Lajna,
    [GameObjectType.Cevko]: Cevko,
    [GameObjectType.SpeedBoost]: SpeedBoost,
    [GameObjectType.Invincibility]: Invincibility,
    [GameObjectType.Policajt]: Policajt,
    [GameObjectType.Auto]: Auto,
    [GameObjectType.Barikada]: Barikada,
    [GameObjectType.Leseni]: Leseni,
};

const GameItemVisual: React.FC<{ object: GameObject }> = memo(({ object }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const Visual = visuals[object.type];
    const obstacle = isObstacleType(object.type);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        if (!obstacle) {
            groupRef.current.rotation.y = clock.elapsedTime * 1.7 + object.id % Math.PI;
            groupRef.current.position.y = object.position[1] + Math.sin(clock.elapsedTime * 3.1 + object.id) * 0.12;
        } else if (object.type === GameObjectType.Policajt) {
            groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 5 + object.id) * 0.025;
        }
    });

    return (
        <group
            ref={groupRef}
            position={[object.position[0], obstacle ? 0 : object.position[1], object.position[2]]}
        >
            <Visual />
        </group>
    );
});

GameItemVisual.displayName = 'GameItemVisual';

export const GameItems: React.FC<{ gameObjects: GameObject[] }> = ({ gameObjects }) => (
    <group>
        {gameObjects.map(object => <GameItemVisual key={object.id} object={object} />)}
    </group>
);
