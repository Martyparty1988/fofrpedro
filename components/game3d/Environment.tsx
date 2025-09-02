import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BUILDING_COUNT = 25; // per side
const SPREAD = 200;
const LANE_WIDTH = 14;

interface Building {
    position: [number, number, number];
    scale: [number, number, number];
}

const BuildingInstances: React.FC<{ speed: number; side: -1 | 1; color: string }> = ({ speed, side, color }) => {
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null!);
    const buildings = useMemo<Building[]>(() => {
        const temp: Building[] = [];
        for (let i = 0; i < BUILDING_COUNT; i++) {
            temp.push({
                position: [
                    (LANE_WIDTH / 2 + 5 + Math.random() * 10) * side,
                    0,
                    (Math.random() - 0.5) * SPREAD
                ],
                scale: [
                    4 + Math.random() * 6,
                    20 + Math.random() * 80,
                    4 + Math.random() * 6
                ],
            });
        }
        return temp;
    }, [side]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((_, delta) => {
        if (!instancedMeshRef.current) return;
        const movement = speed * delta;

        buildings.forEach((building, i) => {
            building.position[2] += movement;
             if (building.position[2] > SPREAD / 2) {
                building.position[2] -= SPREAD;
            }
            dummy.position.set(building.position[0], building.scale[1]/2, building.position[2]);
            dummy.scale.set(building.scale[0], building.scale[1], building.scale[2]);
            dummy.updateMatrix();
            instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        });
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });
    
    return (
       <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, BUILDING_COUNT]} castShadow receiveShadow>
            <boxGeometry />
            <meshStandardMaterial color="#050505" emissive={color} emissiveIntensity={2} roughness={0.7} />
       </instancedMesh>
    );
};

export const Environment: React.FC<{ speed: number }> = ({ speed }) => {
    return (
        <group>
            <BuildingInstances speed={speed} side={-1} color="#ff00ff" />
            <BuildingInstances speed={speed} side={1} color="#00ffff" />
        </group>
    );
};
