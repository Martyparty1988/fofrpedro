import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RAIN_COUNT = 1500;
const RAIN_AREA_X = 40;
const RAIN_AREA_Y = 30;
const RAIN_AREA_Z = 60;

export const Rain: React.FC<{ speed: number }> = ({ speed }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        return Array.from({ length: RAIN_COUNT }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * RAIN_AREA_X,
                Math.random() * RAIN_AREA_Y,
                (Math.random() - 0.5) * RAIN_AREA_Z
            ),
            velocity: new THREE.Vector3(0, -15 - Math.random() * 10, 0),
        }));
    }, []);

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        const baseForwardSpeed = speed * 1.2;

        particles.forEach((p, i) => {
            p.position.y += p.velocity.y * delta;
            p.position.z += baseForwardSpeed * delta;

            // Reset particle if it's out of bounds
            if (p.position.y < -2) {
                p.position.y = RAIN_AREA_Y;
            }
            if (p.position.z > RAIN_AREA_Z / 2) {
                p.position.z -= RAIN_AREA_Z;
            }

            dummy.position.copy(p.position);
            // Angle the rain to give a sense of speed
            dummy.rotation.x = -Math.PI / 12; 
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_COUNT]}>
            <cylinderGeometry args={[0.01, 0.01, 0.4, 4]} />
            <meshStandardMaterial 
                color="#88aaff" 
                transparent 
                opacity={0.3} 
                emissive="#6688ee" 
                emissiveIntensity={2}
                depthWrite={false}
            />
        </instancedMesh>
    );
};
