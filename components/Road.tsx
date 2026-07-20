import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ROAD_LENGTH = 200;
const ROAD_WIDTH = 14;
const DASH_SPACING = 8;
const DASHES_PER_LANE = 29;
const DASH_SPAN = DASH_SPACING * DASHES_PER_LANE;

interface LaneDash {
    x: number;
    z: number;
}

export const Road: React.FC<{ speed: number }> = ({ speed }) => {
    const road1 = useRef<THREE.Group>(null!);
    const road2 = useRef<THREE.Group>(null!);
    const dashRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const dashes = useMemo<LaneDash[]>(() => {
        const result: LaneDash[] = [];
        for (const x of [-2, 2]) {
            for (let index = 0; index < DASHES_PER_LANE; index++) {
                result.push({ x, z: 28 - index * DASH_SPACING });
            }
        }
        return result;
    }, []);

    const updateDashes = () => {
        if (!dashRef.current) return;
        dashes.forEach((dash, index) => {
            dummy.position.set(dash.x, 0.045, dash.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            dashRef.current.setMatrixAt(index, dummy.matrix);
        });
        dashRef.current.instanceMatrix.needsUpdate = true;
    };

    useLayoutEffect(() => {
        dashRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        updateDashes();
    }, [dashes]);

    useFrame((_, delta) => {
        const movement = speed * delta;
        road1.current.position.z += movement;
        road2.current.position.z += movement;
        if (road1.current.position.z > ROAD_LENGTH) road1.current.position.z -= ROAD_LENGTH * 2;
        if (road2.current.position.z > ROAD_LENGTH) road2.current.position.z -= ROAD_LENGTH * 2;

        dashes.forEach(dash => {
            dash.z += movement;
            if (dash.z > 32) dash.z -= DASH_SPAN;
        });
        updateDashes();
    });

    return (
        <group>
            {[0, -ROAD_LENGTH].map((z, index) => (
                <group key={z} ref={index === 0 ? road1 : road2} position-z={z}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
                        <meshPhysicalMaterial
                            color="#080d13"
                            roughness={0.2}
                            metalness={0.58}
                            clearcoat={0.72}
                            clearcoatRoughness={0.2}
                        />
                    </mesh>

                    {[-8.25, 8.25].map(x => (
                        <mesh key={`walk-${x}`} position={[x, 0.09, 0]} receiveShadow>
                            <boxGeometry args={[2.5, 0.18, ROAD_LENGTH]} />
                            <meshStandardMaterial color="#202631" roughness={0.92} metalness={0.08} />
                        </mesh>
                    ))}
                    {[-7.08, 7.08].map(x => (
                        <mesh key={`curb-${x}`} position={[x, 0.15, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.18, 0.3, ROAD_LENGTH]} />
                            <meshStandardMaterial color="#5c6672" roughness={0.78} metalness={0.18} />
                        </mesh>
                    ))}
                    {[-6.72, 6.72].map(x => (
                        <mesh key={`gutter-${x}`} position={[x, 0.028, 0]}>
                            <boxGeometry args={[0.38, 0.025, ROAD_LENGTH]} />
                            <meshPhysicalMaterial color="#05080d" roughness={0.12} metalness={0.78} clearcoat={1} />
                        </mesh>
                    ))}
                    {[-1.15, 1.15].map(x => (
                        <mesh key={`rail-${x}`} position={[x, 0.035, 0]}>
                            <boxGeometry args={[0.07, 0.04, ROAD_LENGTH]} />
                            <meshStandardMaterial color="#87909a" roughness={0.24} metalness={0.94} />
                        </mesh>
                    ))}
                </group>
            ))}

            <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]} frustumCulled={false} receiveShadow>
                <boxGeometry args={[0.11, 0.028, 3.1]} />
                <meshStandardMaterial color="#c8d0d5" roughness={0.48} metalness={0.2} />
            </instancedMesh>
        </group>
    );
};
