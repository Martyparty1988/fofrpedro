import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createAsphaltTextures, createPavingTexture } from '../lib/materialTextures';

const ROAD_LENGTH = 200;
const ROAD_CENTER_Z = -70;
const ROAD_WIDTH = 14;
const DASH_SPACING = 8;
const DASHES_PER_LANE = 29;
const DASH_SPAN = DASH_SPACING * DASHES_PER_LANE;

interface LaneDash {
    x: number;
    z: number;
}

interface Puddle {
    x: number;
    z: number;
    width: number;
    depth: number;
    rotation: number;
}

const seededRandom = (seed: number) => {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
};

export const Road: React.FC<{ speed: number }> = ({ speed }) => {
    const dashRef = useRef<THREE.InstancedMesh>(null!);
    const puddleRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const asphalt = useMemo(() => createAsphaltTextures(), []);
    const paving = useMemo(() => createPavingTexture(), []);

    const dashes = useMemo<LaneDash[]>(() => {
        const result: LaneDash[] = [];
        for (const x of [-2, 2]) {
            for (let index = 0; index < DASHES_PER_LANE; index++) {
                result.push({ x, z: 28 - index * DASH_SPACING });
            }
        }
        return result;
    }, []);

    const puddles = useMemo<Puddle[]>(() => {
        const random = seededRandom(0x574554);
        return Array.from({ length: 22 }, (_, index) => ({
            x: (random() - 0.5) * 12.2,
            z: 22 - index * (DASH_SPAN / 22),
            width: 0.55 + random() * 1.35,
            depth: 0.22 + random() * 0.7,
            rotation: random() * Math.PI,
        }));
    }, []);

    const updateInstances = () => {
        if (!dashRef.current || !puddleRef.current) return;

        dashes.forEach((dash, index) => {
            dummy.position.set(dash.x, 0.047, dash.z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            dashRef.current.setMatrixAt(index, dummy.matrix);
        });

        puddles.forEach((puddle, index) => {
            dummy.position.set(puddle.x, 0.025, puddle.z);
            dummy.rotation.set(-Math.PI / 2, 0, puddle.rotation);
            dummy.scale.set(puddle.width, puddle.depth, 1);
            dummy.updateMatrix();
            puddleRef.current.setMatrixAt(index, dummy.matrix);
        });

        dashRef.current.instanceMatrix.needsUpdate = true;
        puddleRef.current.instanceMatrix.needsUpdate = true;
    };

    useLayoutEffect(() => {
        dashRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        puddleRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        updateInstances();
    }, [dashes, puddles]);

    useEffect(() => () => {
        asphalt.color.dispose();
        asphalt.roughness.dispose();
        paving.dispose();
    }, [asphalt, paving]);

    useFrame((_, delta) => {
        const movement = speed * delta;
        const textureShift = movement / ROAD_LENGTH;
        asphalt.color.offset.y -= textureShift;
        asphalt.roughness.offset.y -= textureShift;
        paving.offset.y -= textureShift;

        dashes.forEach(dash => {
            dash.z += movement;
            if (dash.z > 32) dash.z -= DASH_SPAN;
        });
        puddles.forEach(puddle => {
            puddle.z += movement;
            if (puddle.z > 32) puddle.z -= DASH_SPAN;
        });
        updateInstances();
    });

    return (
        <group>
            <mesh position={[0, 0, ROAD_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
                <MeshReflectorMaterial
                    color="#111820"
                    map={asphalt.color}
                    roughnessMap={asphalt.roughness}
                    roughness={0.72}
                    metalness={0.18}
                    mirror={0.38}
                    mixBlur={1.25}
                    mixStrength={1.15}
                    blur={[220, 70]}
                    resolution={512}
                    depthScale={0.32}
                    minDepthThreshold={0.72}
                    maxDepthThreshold={1.25}
                />
            </mesh>

            {[-8.25, 8.25].map(x => (
                <mesh key={`walk-${x}`} position={[x, 0.09, ROAD_CENTER_Z]} receiveShadow>
                    <boxGeometry args={[2.5, 0.18, ROAD_LENGTH]} />
                    <meshStandardMaterial map={paving} color="#a6abb0" roughness={0.94} metalness={0.04} />
                </mesh>
            ))}
            {[-7.08, 7.08].map(x => (
                <mesh key={`curb-${x}`} position={[x, 0.15, ROAD_CENTER_Z]} castShadow receiveShadow>
                    <boxGeometry args={[0.18, 0.3, ROAD_LENGTH]} />
                    <meshStandardMaterial color="#8b949d" roughness={0.8} metalness={0.12} />
                </mesh>
            ))}
            {[-6.72, 6.72].map(x => (
                <mesh key={`gutter-${x}`} position={[x, 0.028, ROAD_CENTER_Z]}>
                    <boxGeometry args={[0.38, 0.025, ROAD_LENGTH]} />
                    <meshPhysicalMaterial color="#05080d" roughness={0.12} metalness={0.78} clearcoat={1} />
                </mesh>
            ))}
            {[-1.15, 1.15].map(x => (
                <mesh key={`rail-${x}`} position={[x, 0.035, ROAD_CENTER_Z]}>
                    <boxGeometry args={[0.07, 0.04, ROAD_LENGTH]} />
                    <meshStandardMaterial color="#a9b0b7" roughness={0.2} metalness={0.96} />
                </mesh>
            ))}

            <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]} frustumCulled={false} receiveShadow>
                <boxGeometry args={[0.11, 0.028, 3.1]} />
                <meshStandardMaterial color="#d6d9d9" roughness={0.58} metalness={0.12} />
            </instancedMesh>

            <instancedMesh ref={puddleRef} args={[undefined, undefined, puddles.length]} frustumCulled={false} receiveShadow>
                <circleGeometry args={[1, 28]} />
                <meshPhysicalMaterial
                    color="#0a1721"
                    transparent
                    opacity={0.46}
                    roughness={0.08}
                    metalness={0.32}
                    clearcoat={1}
                    clearcoatRoughness={0.04}
                    depthWrite={false}
                />
            </instancedMesh>
        </group>
    );
};
