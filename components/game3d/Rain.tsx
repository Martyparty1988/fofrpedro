import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneQuality } from './GameScene3D';

const VERTEX_SHADER = `
    uniform float uTime;
    uniform float uSpeed;
    attribute float fallSpeed;
    varying float vAlpha;

    void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * fallSpeed + 2.0, 32.0) - 2.0;
        p.z = mod(p.z + uTime * (uSpeed * 1.1 + 5.0) + 30.0, 60.0) - 30.0;
        vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(18.0 / -viewPosition.z, 1.2, 4.2);
        vAlpha = clamp(1.0 - (-viewPosition.z / 68.0), 0.18, 0.72);
    }
`;

const FRAGMENT_SHADER = `
    varying float vAlpha;

    void main() {
        float horizontal = smoothstep(0.5, 0.12, abs(gl_PointCoord.x - 0.5));
        float vertical = smoothstep(0.5, 0.04, abs(gl_PointCoord.y - 0.5));
        float alpha = horizontal * vertical * vAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(0.48, 0.68, 0.94, alpha);
    }
`;

export const Rain: React.FC<{ speed: number; quality: SceneQuality }> = ({ speed, quality }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null!);
    const count = quality === 'high' ? 700 : quality === 'balanced' ? 420 : 220;
    const { positions, fallSpeeds } = useMemo(() => {
        const nextPositions = new Float32Array(count * 3);
        const nextFallSpeeds = new Float32Array(count);
        for (let index = 0; index < count; index++) {
            nextPositions[index * 3] = (Math.random() - 0.5) * 38;
            nextPositions[index * 3 + 1] = Math.random() * 30;
            nextPositions[index * 3 + 2] = (Math.random() - 0.5) * 60;
            nextFallSpeeds[index] = 15 + Math.random() * 10;
        }
        return { positions: nextPositions, fallSpeeds: nextFallSpeeds };
    }, [count]);

    useFrame((_, delta) => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.uTime.value += delta;
        materialRef.current.uniforms.uSpeed.value = speed;
    });

    return (
        <points frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-fallSpeed" args={[fallSpeeds, 1]} />
            </bufferGeometry>
            <shaderMaterial
                ref={materialRef}
                transparent
                depthWrite={false}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                uniforms={{ uTime: { value: 0 }, uSpeed: { value: speed } }}
                vertexShader={VERTEX_SHADER}
                fragmentShader={FRAGMENT_SHADER}
            />
        </points>
    );
};
