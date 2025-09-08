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
        <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[1.2, 2.2, 0.8]} />
            <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        <mesh castShadow position={[0, 1.8, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#facc15" />
        </mesh>
    </group>
);

const Auto: React.FC = () => (
    <group>
        <mesh castShadow position={[0, 0.3, 0]}>
            <boxGeometry args={[2.5, 1.2, 5]} />
            <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 1.2, -0.8]}>
            <boxGeometry args={[2.2, 1, 2.5]} />
            <meshStandardMaterial color="#222222" roughness={0.2} metalness={0.8} />
        </mesh>
    </group>
);

const Barikada: React.FC = () => (
    <group>
        <mesh castShadow position={[-1.2, 0.6, 0]}>
            <coneGeometry args={[0.3, 1.2, 16]} />
            <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh castShadow position={[1.2, 0.6, 0]}>
            <coneGeometry args={[0.3, 1.2, 16]} />
            <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.8, 2.8, 0.1]} />
            <meshStandardMaterial color="#eab308" />
        </mesh>
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
