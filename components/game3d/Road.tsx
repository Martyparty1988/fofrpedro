import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ROAD_LENGTH = 200;
const ROAD_WIDTH = 14;

const LANE_LINE_LENGTH = ROAD_LENGTH;
const LaneLines: React.FC<{ speed: number }> = ({ speed }) => {
    const lines1 = useRef<THREE.Group>(null!);
    const lines2 = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        const movement = speed * delta;
        if (lines1.current) {
            lines1.current.position.z += movement;
            if (lines1.current.position.z > LANE_LINE_LENGTH) {
                lines1.current.position.z -= LANE_LINE_LENGTH * 2;
            }
        }
        if (lines2.current) {
            lines2.current.position.z += movement;
            if (lines2.current.position.z > LANE_LINE_LENGTH) {
                lines2.current.position.z -= LANE_LINE_LENGTH * 2;
            }
        }
    });

    const lanePositions = [-2, 2]; // For two lines
    
    return (
        <group>
            <group ref={lines1} position-z={0}>
                {lanePositions.map(pos =>
                    <mesh key={pos} position={[pos, 0.02, -LANE_LINE_LENGTH / 2]}>
                        <boxGeometry args={[0.1, 0.01, LANE_LINE_LENGTH]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
                    </mesh>
                )}
            </group>
            <group ref={lines2} position-z={-LANE_LINE_LENGTH}>
                {lanePositions.map(pos =>
                    <mesh key={pos} position={[pos, 0.02, -LANE_LINE_LENGTH / 2]}>
                        <boxGeometry args={[0.1, 0.01, LANE_LINE_LENGTH]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
                    </mesh>
                )}
            </group>
        </group>
    );
}

export const Road: React.FC<{ speed: number }> = ({ speed }) => {
    const road1 = useRef<THREE.Mesh>(null!);
    const road2 = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        const movement = speed * delta;
        road1.current.position.z += movement;
        road2.current.position.z += movement;

        if (road1.current.position.z > ROAD_LENGTH) {
            road1.current.position.z -= ROAD_LENGTH * 2;
        }
        if (road2.current.position.z > ROAD_LENGTH) {
            road2.current.position.z -= ROAD_LENGTH * 2;
        }
    });

    return (
        <group>
            <mesh ref={road1} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
                <meshStandardMaterial color="#101010" metalness={0.6} roughness={0.6} />
            </mesh>
            <mesh ref={road2} position={[0, 0, -ROAD_LENGTH]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
                <meshStandardMaterial color="#101010" metalness={0.6} roughness={0.6} />
            </mesh>
            <LaneLines speed={speed} />
        </group>
    );
};