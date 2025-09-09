import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GameObject, GameObjectType } from '../../types';

const Lajna: React.FC = () => (
    <mesh castShadow>
        <boxGeometry args={[0.5, 0.1, 2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} toneMapped={false} />
    </mesh>
);

const Cevko: React.FC = () => (
    <mesh castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} toneMapped={false} />
    </mesh>
);

const SpeedBoost: React.FC = () => (
    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.1, 8, 32]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} toneMapped={false} />
    </mesh>
);

const Invincibility: React.FC = () => (
    <mesh castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} toneMapped={false} />
    </mesh>
);

const Policajt: React.FC = () => (
    <group>
        // Tělo
        <mesh castShadow position={[0, 1.1, 0]}>
            <capsuleGeometry args={[0.4, 1.4, 4, 16]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
        </mesh>
        // Hlava
        <mesh castShadow position={[0, 2.0, 0]}>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color="#f5d0c5" roughness={0.6} />
        </mesh>
        // Čepice
        <group position={[0, 2.2, 0]}>
            <mesh castShadow>
                <cylinderGeometry args={[0.4, 0.45, 0.3, 32]} />
                <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.15, 0.2]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.5, 0.1, 0.3]} />
                <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} />
            </mesh>
        </group>
        // Odznak
        <mesh position={[0.3, 1.5, 0.4]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
            <meshStandardMaterial color="#facc15" metalness={1} roughness={0.3} />
        </mesh>
        // Opasek
        <mesh position={[0, 1.1, 0]}>
            <torusGeometry args={[0.45, 0.05, 16, 32]} />
            <meshStandardMaterial color="#000000" roughness={0.5} />
        </mesh>
    </group>
);

const Auto: React.FC = () => (
    <group>
        // Karoserie
        <mesh castShadow position={[0, 0.6, 0]}>
            <boxGeometry args={[2.5, 0.8, 5]} />
            <meshStandardMaterial color="#dc2626" roughness={0.2} metalness={0.8} />
        </mesh>
        // Kabina
        <group position={[0, 1.2, -0.8]}>
            <mesh castShadow>
                <boxGeometry args={[2.2, 0.8, 2]} />
                <meshStandardMaterial color="#111827" roughness={0.1} metalness={0.9} />
            </mesh>
            // Přední sklo
            <mesh position={[0, 0.2, 1]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[2, 0.8, 0.1]} />
                <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} opacity={0.7} transparent />
            </mesh>
        </group>
        // Světla
        <group position={[0, 0.5, 2.4]}>
            <mesh position={[-0.8, 0, 0]}>
                <boxGeometry args={[0.5, 0.3, 0.1]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={2} />
            </mesh>
            <mesh position={[0.8, 0, 0]}>
                <boxGeometry args={[0.5, 0.3, 0.1]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={2} />
            </mesh>
        </group>
        // Kola
        <group>
            {[[-1.3, 0.3, -1.5] as const, [1.3, 0.3, -1.5] as const, [-1.3, 0.3, 1.5] as const, [1.3, 0.3, 1.5] as const].map((pos, i) => (
                <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#1f2937" roughness={0.8} />
                </mesh>
            ))}
        </group>
        // Majáky
        <group position={[0, 1.7, 0]}>
            <mesh position={[-0.5, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
                <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={3} />
            </mesh>
            <mesh position={[0.5, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
            </mesh>
        </group>
    </group>
);

const Barikada: React.FC = () => (
    <group>
        {/* Kužely */}
        {[[-1.2, 0, 0] as const, [1.2, 0, 0] as const].map((pos, i) => (
            <group key={i} position={pos}>
                <mesh castShadow position={[0, 0.6, 0]}>
                    <coneGeometry args={[0.3, 1.2, 32]} />
                    <meshStandardMaterial color="#f97316" roughness={0.6} />
                </mesh>
                {/* Reflexní pruhy */}
                <mesh position={[0, 0.4, 0]}>
                    <torusGeometry args={[0.31, 0.02, 16, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
                </mesh>
                <mesh position={[0, 0.7, 0]}>
                    <torusGeometry args={[0.25, 0.02, 16, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
                </mesh>
            </group>
        ))}
        
        {/* Výstražná páska */}
        <group position={[0, 0.9, 0]}>
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.8, 2.8, 0.05]} />
                <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
            {/* Černé pruhy na pásce */}
            {Array.from({length: 5}).map((_, i) => (
                <mesh key={i} position={[0, -1.2 + i * 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[0.15, 2.8, 0.06]} />
                    <meshStandardMaterial color="#000000" />
                </mesh>
            ))}
        </group>

        {/* Výstražná světla */}
        {[[-1.2, 1.3, 0] as const, [1.2, 1.3, 0] as const].map((pos, i) => (
            <mesh key={i} position={pos}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
            </mesh>
        ))}
    </group>
);

const itemComponents: Record<GameObjectType, React.FC> = {
    [GameObjectType.Lajna]: Lajna,
    [GameObjectType.Cevko]: Cevko,
    [GameObjectType.SpeedBoost]: SpeedBoost,
    [GameObjectType.Invincibility]: Invincibility,
    [GameObjectType.Policajt]: Policajt,
    [GameObjectType.Auto]: Auto,
    [GameObjectType.Barikada]: Barikada,
};

export const GameItems: React.FC<{ gameObjects: GameObject[] }> = ({ gameObjects }) => {
    return (
        <group>
            {gameObjects.map(obj => {
                const ItemComponent = itemComponents[obj.type];
                return ItemComponent ? (
                    <group key={obj.id} position={obj.position}>
                        <ItemComponent />
                    </group>
                ) : null;
            })}
        </group>
    );
};
