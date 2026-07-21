import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CITY_SPAN, CitySide, createCityLayout } from '../../lib/cityLayout';
import { createFacadeTexture, createSignTexture } from '../../lib/materialTextures';
import type { SceneQuality } from './GameScene3D';

const CITY_FRONT = 55;

interface BuildingStripProps {
    speed: number;
    side: CitySide;
    seed: number;
}

const BuildingStrip: React.FC<BuildingStripProps> = ({ speed, side, seed }) => {
    const layout = useMemo(() => createCityLayout(side, seed), [seed, side]);
    const bodyRef = useRef<THREE.InstancedMesh>(null!);
    const roofRef = useRef<THREE.InstancedMesh>(null!);
    const trimRef = useRef<THREE.InstancedMesh>(null!);
    const windowFrameRef = useRef<THREE.InstancedMesh>(null!);
    const windowRef = useRef<THREE.InstancedMesh>(null!);
    const sillRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const facadeTexture = useMemo(() => createFacadeTexture(seed), [seed]);

    const updateMatrices = () => {
        if (
            !bodyRef.current
            || !roofRef.current
            || !trimRef.current
            || !windowFrameRef.current
            || !windowRef.current
            || !sillRef.current
        ) return;

        layout.buildings.forEach((building, index) => {
            dummy.rotation.set(0, 0, 0);
            dummy.position.set(building.x, building.height / 2, building.z);
            dummy.scale.set(building.width, building.height, building.depth);
            dummy.updateMatrix();
            bodyRef.current.setMatrixAt(index, dummy.matrix);

            dummy.position.set(building.x, building.height + 0.38, building.z);
            dummy.scale.set(building.width * 0.42, 0.76, building.depth * 0.42);
            dummy.updateMatrix();
            roofRef.current.setMatrixAt(index, dummy.matrix);

            const facadeX = building.x - side * (building.width / 2 + 0.055);
            for (let trim = 0; trim < 2; trim++) {
                dummy.position.set(
                    facadeX,
                    building.height / 2,
                    building.z + (trim === 0 ? -1 : 1) * building.depth * 0.39,
                );
                dummy.scale.set(0.08, building.height * 0.82, 0.09);
                dummy.updateMatrix();
                trimRef.current.setMatrixAt(index * 2 + trim, dummy.matrix);
            }
        });

        layout.windows.forEach((window, index) => {
            const building = layout.buildings[window.buildingIndex];
            dummy.rotation.set(0, 0, 0);
            const facadeX = building.x - side * (building.width / 2 + 0.07);
            dummy.position.set(
                facadeX + side * 0.014,
                window.y,
                building.z + window.zOffset,
            );
            dummy.scale.set(0.045, 0.64, 0.78);
            dummy.updateMatrix();
            windowFrameRef.current.setMatrixAt(index, dummy.matrix);

            dummy.position.set(
                facadeX,
                window.y,
                building.z + window.zOffset,
            );
            dummy.scale.set(0.055, 0.52, 0.64);
            dummy.updateMatrix();
            windowRef.current.setMatrixAt(index, dummy.matrix);

            dummy.position.set(
                facadeX - side * 0.018,
                window.y - 0.61,
                building.z + window.zOffset,
            );
            dummy.scale.set(0.09, 0.055, 0.84);
            dummy.updateMatrix();
            sillRef.current.setMatrixAt(index, dummy.matrix);
        });

        bodyRef.current.instanceMatrix.needsUpdate = true;
        roofRef.current.instanceMatrix.needsUpdate = true;
        trimRef.current.instanceMatrix.needsUpdate = true;
        windowFrameRef.current.instanceMatrix.needsUpdate = true;
        windowRef.current.instanceMatrix.needsUpdate = true;
        sillRef.current.instanceMatrix.needsUpdate = true;
    };

    useLayoutEffect(() => {
        bodyRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        roofRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        trimRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        windowFrameRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        windowRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        sillRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        layout.buildings.forEach((building, index) => {
            bodyRef.current.setColorAt(index, new THREE.Color(building.bodyColor));
            trimRef.current.setColorAt(index * 2, new THREE.Color(building.accentColor));
            trimRef.current.setColorAt(index * 2 + 1, new THREE.Color(building.accentColor));
        });
        layout.windows.forEach((window, index) => {
            windowRef.current.setColorAt(index, new THREE.Color(window.color));
        });

        if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
        if (trimRef.current.instanceColor) trimRef.current.instanceColor.needsUpdate = true;
        if (windowRef.current.instanceColor) windowRef.current.instanceColor.needsUpdate = true;
        updateMatrices();
    }, [layout]);

    useEffect(() => () => facadeTexture.dispose(), [facadeTexture]);

    useFrame((_, delta) => {
        const movement = speed * delta;
        layout.buildings.forEach(building => {
            building.z += movement;
            if (building.z > CITY_FRONT) building.z -= CITY_SPAN;
        });
        updateMatrices();
    });

    return (
        <group>
            <instancedMesh ref={bodyRef} args={[undefined, undefined, layout.buildings.length]} frustumCulled={false} castShadow receiveShadow>
                <boxGeometry />
                <meshStandardMaterial map={facadeTexture} vertexColors roughness={0.86} metalness={0.08} />
            </instancedMesh>
            <instancedMesh ref={roofRef} args={[undefined, undefined, layout.buildings.length]} frustumCulled={false} castShadow>
                <boxGeometry />
                <meshStandardMaterial color="#090e17" roughness={0.6} metalness={0.38} />
            </instancedMesh>
            <instancedMesh ref={trimRef} args={[undefined, undefined, layout.buildings.length * 2]} frustumCulled={false}>
                <boxGeometry />
                <meshStandardMaterial vertexColors roughness={0.42} metalness={0.62} />
            </instancedMesh>
            <instancedMesh ref={windowFrameRef} args={[undefined, undefined, layout.windows.length]} frustumCulled={false} castShadow>
                <boxGeometry />
                <meshStandardMaterial color="#101720" roughness={0.38} metalness={0.72} />
            </instancedMesh>
            <instancedMesh ref={windowRef} args={[undefined, undefined, layout.windows.length]} frustumCulled={false}>
                <boxGeometry />
                <meshBasicMaterial vertexColors toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={sillRef} args={[undefined, undefined, layout.windows.length]} frustumCulled={false} castShadow>
                <boxGeometry />
                <meshStandardMaterial color="#56616d" roughness={0.64} metalness={0.34} />
            </instancedMesh>
        </group>
    );
};

interface StreetFixture {
    side: CitySide;
    z: number;
    color: string;
}

const StreetFurniture: React.FC<{ speed: number }> = ({ speed }) => {
    const fixtures = useMemo<StreetFixture[]>(() => {
        const result: StreetFixture[] = [];
        const spacing = 17;
        const count = Math.ceil(CITY_SPAN / spacing);

        for (let index = 0; index < count; index++) {
            for (const side of [-1, 1] as const) {
                result.push({
                    side,
                    z: -CITY_SPAN / 2 + index * spacing + (side === 1 ? spacing / 2 : 0),
                    color: (index + side) % 3 === 0 ? '#ff65c3' : '#70e1f5',
                });
            }
        }
        return result;
    }, []);
    const crossWires = useMemo(
        () => Array.from({ length: 9 }, (_, index) => ({ z: -CITY_SPAN / 2 + index * (CITY_SPAN / 9) })),
        [],
    );
    const poleRef = useRef<THREE.InstancedMesh>(null!);
    const armRef = useRef<THREE.InstancedMesh>(null!);
    const bulbRef = useRef<THREE.InstancedMesh>(null!);
    const wireRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const updateMatrices = () => {
        if (!poleRef.current || !armRef.current || !bulbRef.current || !wireRef.current) return;

        fixtures.forEach((fixture, index) => {
            dummy.rotation.set(0, 0, 0);
            dummy.position.set(fixture.side * 7.9, 2.8, fixture.z);
            dummy.scale.set(0.075, 5.6, 0.075);
            dummy.updateMatrix();
            poleRef.current.setMatrixAt(index, dummy.matrix);

            dummy.position.set(fixture.side * 7.35, 5.48, fixture.z);
            dummy.scale.set(1.15, 0.05, 0.05);
            dummy.updateMatrix();
            armRef.current.setMatrixAt(index, dummy.matrix);

            dummy.position.set(fixture.side * 6.78, 5.42, fixture.z);
            dummy.scale.setScalar(0.13);
            dummy.updateMatrix();
            bulbRef.current.setMatrixAt(index, dummy.matrix);
        });

        crossWires.forEach((wire, index) => {
            dummy.position.set(0, 6.18, wire.z);
            dummy.scale.set(15.8, 0.012, 0.012);
            dummy.updateMatrix();
            wireRef.current.setMatrixAt(index, dummy.matrix);
        });

        poleRef.current.instanceMatrix.needsUpdate = true;
        armRef.current.instanceMatrix.needsUpdate = true;
        bulbRef.current.instanceMatrix.needsUpdate = true;
        wireRef.current.instanceMatrix.needsUpdate = true;
    };

    useLayoutEffect(() => {
        fixtures.forEach((fixture, index) => {
            bulbRef.current.setColorAt(index, new THREE.Color(fixture.color));
        });
        if (bulbRef.current.instanceColor) bulbRef.current.instanceColor.needsUpdate = true;
        updateMatrices();
    }, [fixtures]);

    useFrame((_, delta) => {
        const movement = speed * delta;
        fixtures.forEach(fixture => {
            fixture.z += movement;
            if (fixture.z > CITY_FRONT) fixture.z -= CITY_SPAN;
        });
        crossWires.forEach(wire => {
            wire.z += movement;
            if (wire.z > CITY_FRONT) wire.z -= CITY_SPAN;
        });
        updateMatrices();
    });

    return (
        <group>
            <instancedMesh ref={poleRef} args={[undefined, undefined, fixtures.length]} frustumCulled={false} castShadow>
                <cylinderGeometry args={[1, 1, 1, 8]} />
                <meshStandardMaterial color="#263241" roughness={0.4} metalness={0.78} />
            </instancedMesh>
            <instancedMesh ref={armRef} args={[undefined, undefined, fixtures.length]} frustumCulled={false}>
                <boxGeometry />
                <meshStandardMaterial color="#263241" roughness={0.4} metalness={0.78} />
            </instancedMesh>
            <instancedMesh ref={bulbRef} args={[undefined, undefined, fixtures.length]} frustumCulled={false}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshBasicMaterial vertexColors toneMapped={false} />
            </instancedMesh>
            <instancedMesh ref={wireRef} args={[undefined, undefined, crossWires.length]} frustumCulled={false}>
                <boxGeometry />
                <meshStandardMaterial color="#202a36" roughness={0.45} metalness={0.7} />
            </instancedMesh>
        </group>
    );
};

interface TransitStopDefinition {
    side: CitySide;
    z: number;
    label: string;
    accent: string;
}

const TransitStops: React.FC<{ speed: number }> = ({ speed }) => {
    const stops = useMemo<TransitStopDefinition[]>(() => [
        { side: -1, z: -18, label: 'TRAM 9', accent: '#70e1f5' },
        { side: 1, z: -74, label: 'ŽIŽKOV', accent: '#ff65c3' },
        { side: -1, z: -126, label: 'NOČNÍ', accent: '#facc15' },
    ], []);
    const stopRefs = useRef<Array<THREE.Group | null>>([]);
    const signs = useMemo(
        () => stops.map(stop => createSignTexture(stop.label, stop.accent)),
        [stops],
    );

    useEffect(() => () => signs.forEach(sign => sign.dispose()), [signs]);

    useFrame((_, delta) => {
        const movement = speed * delta;
        stops.forEach((stop, index) => {
            stop.z += movement;
            if (stop.z > CITY_FRONT) stop.z -= CITY_SPAN;
            if (stopRefs.current[index]) stopRefs.current[index]!.position.z = stop.z;
        });
    });

    return (
        <group>
            {stops.map((stop, index) => (
                <group
                    key={stop.label}
                    ref={node => {
                        stopRefs.current[index] = node;
                    }}
                    position={[stop.side * 8.35, 0, stop.z]}
                >
                    <mesh castShadow position={[0, 2.65, 0]}>
                        <boxGeometry args={[1.55, 0.14, 3.5]} />
                        <meshStandardMaterial color="#2c3742" roughness={0.34} metalness={0.76} />
                    </mesh>
                    <mesh position={[stop.side * 0.62, 1.42, 0]}>
                        <boxGeometry args={[0.075, 2.35, 3.25]} />
                        <meshPhysicalMaterial
                            color="#8ab7ca"
                            transparent
                            opacity={0.26}
                            transmission={0.52}
                            roughness={0.14}
                            metalness={0.08}
                            depthWrite={false}
                        />
                    </mesh>
                    {[-1.55, 1.55].map(z => (
                        <mesh key={z} position={[0, 1.42, z]}>
                            <boxGeometry args={[1.35, 2.35, 0.065]} />
                            <meshPhysicalMaterial
                                color="#8ab7ca"
                                transparent
                                opacity={0.22}
                                transmission={0.48}
                                roughness={0.16}
                                depthWrite={false}
                            />
                        </mesh>
                    ))}
                    <mesh castShadow position={[-stop.side * 0.15, 0.66, 0]}>
                        <boxGeometry args={[0.58, 0.18, 1.85]} />
                        <meshStandardMaterial color="#3f4a55" roughness={0.58} metalness={0.48} />
                    </mesh>
                    <mesh castShadow position={[-stop.side * 0.92, 1.8, -1.9]}>
                        <cylinderGeometry args={[0.045, 0.055, 3.6, 8]} />
                        <meshStandardMaterial color="#5d6974" roughness={0.4} metalness={0.78} />
                    </mesh>
                    <mesh position={[-stop.side * 0.92, 3.2, -1.86]}>
                        <planeGeometry args={[1.7, 0.72]} />
                        <meshBasicMaterial map={signs[index]} toneMapped={false} side={THREE.DoubleSide} />
                    </mesh>
                    <pointLight position={[-stop.side * 0.25, 2.35, 0]} color="#d8efff" intensity={6} distance={7} decay={2} />
                </group>
            ))}
        </group>
    );
};

const PragueLandmarks: React.FC<{ speed: number }> = ({ speed }) => {
    const towerRef = useRef<THREE.Group>(null!);
    const spiresRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        const movement = speed * delta * 0.65;
        towerRef.current.position.z += movement;
        spiresRef.current.position.z += movement;
        if (towerRef.current.position.z > CITY_FRONT) towerRef.current.position.z -= CITY_SPAN;
        if (spiresRef.current.position.z > CITY_FRONT) spiresRef.current.position.z -= CITY_SPAN;
    });

    return (
        <group>
            <group ref={towerRef} position={[-25, 0, -72]}>
                <mesh position={[0, 13, 0]} castShadow>
                    <cylinderGeometry args={[0.7, 1.2, 26, 10]} />
                    <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.45} />
                </mesh>
                {[16, 20, 23].map((y, index) => (
                    <mesh key={y} position={[0, y, 0]} scale={[2.6 - index * 0.35, 0.65, 2.6 - index * 0.35]}>
                        <sphereGeometry args={[1, 16, 10]} />
                        <meshStandardMaterial color="#26394d" roughness={0.34} metalness={0.68} />
                    </mesh>
                ))}
                <mesh position={[0, 29, 0]}>
                    <cylinderGeometry args={[0.06, 0.16, 12, 8]} />
                    <meshStandardMaterial color="#364152" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh position={[0, 35, 0]}>
                    <sphereGeometry args={[0.16, 8, 6]} />
                    <meshBasicMaterial color="#ef4444" toneMapped={false} />
                </mesh>
            </group>

            <group ref={spiresRef} position={[24, 0, -108]}>
                <mesh position={[0, 8, 0]}>
                    <boxGeometry args={[9, 16, 7]} />
                    <meshStandardMaterial color="#101826" roughness={0.82} />
                </mesh>
                {[-2.5, 2.5].map(x => (
                    <group key={x} position={[x, 16, 0]}>
                        <mesh position={[0, 3, 0]}>
                            <boxGeometry args={[2.2, 6, 2.2]} />
                            <meshStandardMaterial color="#151f30" roughness={0.78} />
                        </mesh>
                        <mesh position={[0, 8, 0]}>
                            <coneGeometry args={[1.5, 10, 8]} />
                            <meshStandardMaterial color="#202b3a" roughness={0.62} metalness={0.24} />
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
};

export const Environment: React.FC<{ speed: number; quality: SceneQuality }> = ({ speed, quality }) => (
    <group>
        <Stars radius={110} depth={45} count={quality === 'high' ? 650 : quality === 'balanced' ? 420 : 220} factor={2.2} saturation={0.18} fade speed={0.08} />
        <BuildingStrip speed={speed} side={-1} seed={1948} />
        <BuildingStrip speed={speed} side={1} seed={2026} />
        <StreetFurniture speed={speed} />
        {quality !== 'low' && <TransitStops speed={speed} />}
        <PragueLandmarks speed={speed} />
        {[-3.2, 3.2].map(x => (
            <mesh key={x} position={[x, 6.25, -55]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.018, 0.018, CITY_SPAN, 6]} />
                <meshStandardMaterial color="#1b2632" roughness={0.42} metalness={0.7} />
            </mesh>
        ))}
    </group>
);
