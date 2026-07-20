import React, { useRef } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import type { Skin } from '../types';

// --- SVG Icons ---
export const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

export const SpeedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13 2.05v3.03c4.39.54 7.5 4.53 6.96 8.92-.46 3.8-3.35 6.92-7.01 7.23v3.02c5.5-.55 9.5-5.43 8.95-10.93-.45-4.75-4.22-8.5-8.9-8.95zM5.05 5.76C3.39 7.42 2.5 9.61 2.5 12s.89 4.58 2.55 6.24l1.41-1.41C4.89 15.76 4.5 13.95 4.5 12s.39-3.76 1.46-4.83L5.05 5.76z" />
    </svg>
);

export const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
);

export const FlipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" />
    </svg>
);

export const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

export const SlideIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2 7h20v2H2V7zm10 4l-4 4h3v4h2v-4h3l-4-4z"/>
    </svg>
);


// --- Animated human runner model ---

type PlayerModelProps = ThreeElements['group'] & {
    colors: Skin['colors'];
    motion?: 'idle' | 'run';
    reducedMotion?: boolean;
};

const SKIN_TONE = '#c98f70';
const HAIR_COLOR = '#211711';
const TROUSER_COLOR = '#171c27';
const SHOE_COLOR = '#090b10';

const PlayerModelComponent: React.FC<PlayerModelProps> = ({
    colors,
    motion = 'idle',
    reducedMotion = false,
    ...props
}) => {
    const torsoRef = useRef<THREE.Group>(null!);
    const leftArmRef = useRef<THREE.Group>(null!);
    const rightArmRef = useRef<THREE.Group>(null!);
    const leftForearmRef = useRef<THREE.Group>(null!);
    const rightForearmRef = useRef<THREE.Group>(null!);
    const leftLegRef = useRef<THREE.Group>(null!);
    const rightLegRef = useRef<THREE.Group>(null!);
    const leftShinRef = useRef<THREE.Group>(null!);
    const rightShinRef = useRef<THREE.Group>(null!);

    useFrame(({ clock }, delta) => {
        const running = motion === 'run';
        const phase = clock.elapsedTime * (running ? 9 : 1.6);
        const intensity = running ? (reducedMotion ? 0.2 : 0.72) : 0.045;
        const swing = Math.sin(phase) * intensity;
        const bounce = running && !reducedMotion ? Math.abs(Math.sin(phase)) * 0.035 : Math.sin(phase) * 0.008;
        const damping = 1 - Math.exp(-14 * delta);

        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -swing, damping);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, swing, damping);
        leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, -0.3 - Math.max(0, swing) * 0.55, damping);
        rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, -0.3 + Math.min(0, swing) * 0.55, damping);
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, swing, damping);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -swing, damping);
        leftShinRef.current.rotation.x = THREE.MathUtils.lerp(leftShinRef.current.rotation.x, Math.max(0, -swing) * 0.7, damping);
        rightShinRef.current.rotation.x = THREE.MathUtils.lerp(rightShinRef.current.rotation.x, Math.max(0, swing) * 0.7, damping);
        torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, 1.9 + bounce, damping);
        torsoRef.current.rotation.z = THREE.MathUtils.lerp(torsoRef.current.rotation.z, running ? swing * 0.035 : 0, damping);
    });

    return (
        <group {...props}>
            {/* Pelvis and articulated legs */}
            <mesh castShadow position={[0, 1.28, 0]} scale={[1, 0.72, 0.72]}>
                <capsuleGeometry args={[0.3, 0.24, 4, 12]} />
                <meshStandardMaterial color={TROUSER_COLOR} roughness={0.82} />
            </mesh>

            <group ref={leftLegRef} position={[-0.2, 1.27, 0]}>
                <mesh castShadow position={[0, -0.3, 0]} scale={[1, 1, 0.92]}>
                    <capsuleGeometry args={[0.145, 0.36, 4, 10]} />
                    <meshStandardMaterial color={TROUSER_COLOR} roughness={0.9} />
                </mesh>
                <group ref={leftShinRef} position={[0, -0.59, 0]}>
                    <mesh castShadow position={[0, -0.25, 0]} scale={[0.88, 1, 0.9]}>
                        <capsuleGeometry args={[0.13, 0.31, 4, 10]} />
                        <meshStandardMaterial color="#222a38" roughness={0.9} />
                    </mesh>
                    <mesh castShadow position={[0, -0.53, 0.1]}>
                        <boxGeometry args={[0.3, 0.16, 0.5]} />
                        <meshStandardMaterial color={SHOE_COLOR} roughness={0.48} metalness={0.2} />
                    </mesh>
                    <mesh position={[0, -0.58, 0.15]}>
                        <boxGeometry args={[0.31, 0.035, 0.52]} />
                        <meshStandardMaterial color={colors.hat} roughness={0.5} />
                    </mesh>
                </group>
            </group>

            <group ref={rightLegRef} position={[0.2, 1.27, 0]}>
                <mesh castShadow position={[0, -0.3, 0]} scale={[1, 1, 0.92]}>
                    <capsuleGeometry args={[0.145, 0.36, 4, 10]} />
                    <meshStandardMaterial color={TROUSER_COLOR} roughness={0.9} />
                </mesh>
                <group ref={rightShinRef} position={[0, -0.59, 0]}>
                    <mesh castShadow position={[0, -0.25, 0]} scale={[0.88, 1, 0.9]}>
                        <capsuleGeometry args={[0.13, 0.31, 4, 10]} />
                        <meshStandardMaterial color="#222a38" roughness={0.9} />
                    </mesh>
                    <mesh castShadow position={[0, -0.53, 0.1]}>
                        <boxGeometry args={[0.3, 0.16, 0.5]} />
                        <meshStandardMaterial color={SHOE_COLOR} roughness={0.48} metalness={0.2} />
                    </mesh>
                    <mesh position={[0, -0.58, 0.15]}>
                        <boxGeometry args={[0.31, 0.035, 0.52]} />
                        <meshStandardMaterial color={colors.hat} roughness={0.5} />
                    </mesh>
                </group>
            </group>

            {/* Layered jacket and utility harness */}
            <group ref={torsoRef} position={[0, 1.9, 0]}>
                <mesh castShadow scale={[1.02, 1, 0.66]}>
                    <capsuleGeometry args={[0.36, 0.62, 5, 14]} />
                    <meshStandardMaterial color={colors.body} roughness={0.67} metalness={0.12} />
                </mesh>
                <mesh castShadow position={[0, 0.02, 0.27]}>
                    <boxGeometry args={[0.54, 0.68, 0.08]} />
                    <meshStandardMaterial color="#111827" roughness={0.52} metalness={0.35} />
                </mesh>
                <mesh position={[0, 0.02, 0.32]}>
                    <boxGeometry args={[0.035, 0.61, 0.025]} />
                    <meshStandardMaterial color={colors.hat} emissive={colors.hat} emissiveIntensity={1.2} />
                </mesh>
                <mesh castShadow position={[0, -0.47, 0]} scale={[1.02, 0.35, 0.72]}>
                    <cylinderGeometry args={[0.34, 0.34, 0.18, 16]} />
                    <meshStandardMaterial color="#0b0f17" roughness={0.55} metalness={0.5} />
                </mesh>
                <mesh position={[-0.34, -0.47, 0.13]}>
                    <boxGeometry args={[0.16, 0.16, 0.18]} />
                    <meshStandardMaterial color={colors.backpack} roughness={0.6} metalness={0.25} />
                </mesh>

                {/* Backpack with straps and hardware */}
                <group position={[0, 0, -0.37]}>
                    <mesh castShadow>
                        <boxGeometry args={[0.62, 0.88, 0.3]} />
                        <meshStandardMaterial color={colors.backpack} roughness={0.58} metalness={0.22} />
                    </mesh>
                    <mesh castShadow position={[0, 0.31, -0.17]}>
                        <boxGeometry args={[0.46, 0.16, 0.12]} />
                        <meshStandardMaterial color="#0d1119" roughness={0.75} />
                    </mesh>
                    <mesh position={[0, -0.16, -0.17]}>
                        <boxGeometry args={[0.34, 0.08, 0.035]} />
                        <meshStandardMaterial color={colors.hat} emissive={colors.hat} emissiveIntensity={2.2} toneMapped={false} />
                    </mesh>
                </group>
            </group>

            {/* Articulated arms */}
            <group ref={leftArmRef} position={[-0.45, 2.23, 0]} rotation={[0, 0, 0.1]}>
                <mesh castShadow position={[0, -0.28, 0]}>
                    <capsuleGeometry args={[0.12, 0.36, 4, 10]} />
                    <meshStandardMaterial color={colors.body} roughness={0.72} />
                </mesh>
                <group ref={leftForearmRef} position={[0, -0.57, 0]}>
                    <mesh castShadow position={[0, -0.23, 0]} scale={[0.92, 1, 0.92]}>
                        <capsuleGeometry args={[0.11, 0.3, 4, 10]} />
                        <meshStandardMaterial color="#202838" roughness={0.78} />
                    </mesh>
                    <mesh castShadow position={[0, -0.47, 0]}>
                        <sphereGeometry args={[0.125, 12, 10]} />
                        <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
                    </mesh>
                </group>
            </group>

            <group ref={rightArmRef} position={[0.45, 2.23, 0]} rotation={[0, 0, -0.1]}>
                <mesh castShadow position={[0, -0.28, 0]}>
                    <capsuleGeometry args={[0.12, 0.36, 4, 10]} />
                    <meshStandardMaterial color={colors.body} roughness={0.72} />
                </mesh>
                <group ref={rightForearmRef} position={[0, -0.57, 0]}>
                    <mesh castShadow position={[0, -0.23, 0]} scale={[0.92, 1, 0.92]}>
                        <capsuleGeometry args={[0.11, 0.3, 4, 10]} />
                        <meshStandardMaterial color="#202838" roughness={0.78} />
                    </mesh>
                    <mesh castShadow position={[0, -0.47, 0]}>
                        <sphereGeometry args={[0.125, 12, 10]} />
                        <meshStandardMaterial color={SKIN_TONE} roughness={0.7} />
                    </mesh>
                    <mesh position={[0, -0.25, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.12, 0.025, 6, 16]} />
                        <meshStandardMaterial color={colors.hat} emissive={colors.hat} emissiveIntensity={1.6} />
                    </mesh>
                </group>
            </group>

            {/* Neck, face, hair and subtle AR glasses */}
            <mesh castShadow position={[0, 2.46, 0]}>
                <cylinderGeometry args={[0.14, 0.17, 0.25, 14]} />
                <meshStandardMaterial color={SKIN_TONE} roughness={0.72} />
            </mesh>
            <group position={[0, 2.76, 0]}>
                <mesh castShadow scale={[0.87, 1, 0.82]}>
                    <sphereGeometry args={[0.38, 24, 18]} />
                    <meshStandardMaterial color={SKIN_TONE} roughness={0.66} />
                </mesh>
                <mesh castShadow position={[0, 0.1, -0.03]} scale={[0.9, 0.72, 0.86]}>
                    <sphereGeometry args={[0.39, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={HAIR_COLOR} roughness={0.92} />
                </mesh>
                <mesh castShadow position={[0, 0.31, -0.02]} scale={[1, 0.44, 1]}>
                    <sphereGeometry args={[0.405, 20, 12]} />
                    <meshStandardMaterial color={colors.hat} roughness={0.78} />
                </mesh>
                <mesh castShadow position={[0, 0.25, 0.34]}>
                    <boxGeometry args={[0.46, 0.055, 0.24]} />
                    <meshStandardMaterial color={colors.hat} roughness={0.7} />
                </mesh>

                <mesh castShadow position={[0, -0.035, 0.34]} scale={[0.65, 1, 0.8]}>
                    <sphereGeometry args={[0.09, 12, 10]} />
                    <meshStandardMaterial color="#b77960" roughness={0.72} />
                </mesh>
                {[-0.145, 0.145].map(x => (
                    <group key={x} position={[x, 0.055, 0.315]}>
                        <mesh>
                            <sphereGeometry args={[0.045, 12, 8]} />
                            <meshStandardMaterial color="#f5f1e8" roughness={0.4} />
                        </mesh>
                        <mesh position={[0, 0, 0.04]}>
                            <sphereGeometry args={[0.02, 10, 8]} />
                            <meshStandardMaterial color="#17202c" roughness={0.35} />
                        </mesh>
                        <mesh position={[0, 0, 0.065]} scale={[1.4, 0.8, 0.4]}>
                            <boxGeometry args={[0.13, 0.1, 0.02]} />
                            <meshStandardMaterial color="#64d9ef" transparent opacity={0.34} metalness={0.4} roughness={0.18} />
                        </mesh>
                    </group>
                ))}
                <mesh position={[0, 0.055, 0.385]}>
                    <boxGeometry args={[0.14, 0.018, 0.018]} />
                    <meshStandardMaterial color={colors.hat} metalness={0.7} roughness={0.28} />
                </mesh>
                <mesh position={[0, -0.175, 0.305]} scale={[1, 0.45, 0.35]}>
                    <capsuleGeometry args={[0.075, 0.08, 4, 12]} />
                    <meshStandardMaterial color="#72433d" roughness={0.78} />
                </mesh>
                {[-0.34, 0.34].map(x => (
                    <mesh key={x} castShadow position={[x, 0, 0]} scale={[0.45, 0.75, 0.4]}>
                        <sphereGeometry args={[0.16, 12, 10]} />
                        <meshStandardMaterial color={SKIN_TONE} roughness={0.72} />
                    </mesh>
                ))}
            </group>
        </group>
    );
};

export const ProceduralPlayerModel = React.memo(PlayerModelComponent);

// Kept as a compatibility export for any downstream consumer that still uses
// the original name. New game surfaces render RealisticRunner instead.
export const PlayerModel = ProceduralPlayerModel;
