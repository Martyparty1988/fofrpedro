import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ProceduralPlayerModel } from '../../constants/assets';
import { createRunnerPose, type RunnerMotion } from '../../lib/runnerPose';
import type { Skin } from '../../types';

type RealisticRunnerProps = ThreeElements['group'] & {
    colors: Skin['colors'];
    motion?: RunnerMotion;
    reducedMotion?: boolean;
};

type RunnerBoneName =
    | 'pelvis'
    | 'spine'
    | 'head'
    | 'leftUpperArm'
    | 'rightUpperArm'
    | 'leftLowerArm'
    | 'rightLowerArm'
    | 'leftThigh'
    | 'rightThigh'
    | 'leftCalf'
    | 'rightCalf'
    | 'leftFoot'
    | 'rightFoot';

interface RigBone {
    object: THREE.Object3D;
    rest: THREE.Quaternion;
}

const SOURCE_COMMIT = '408db807d2d77fd2c96eb2fbd6517a7fa8106070';
const PRIMARY_MODEL_URL = `https://raw.githubusercontent.com/Mesh2Motion/mesh2motion-app/${SOURCE_COMMIT}/static/models-variation/human-sophia.glb`;
const LOCAL_FALLBACK_URL = '/models/runner-human-base.glb';
const TARGET_MODEL_HEIGHT = 3.05;

const BONE_ALIASES: Record<RunnerBoneName, string[]> = {
    pelvis: ['pelvis', 'hips', 'mixamorighips'],
    spine: ['spine03', 'spine2', 'spine', 'mixamorigspine2'],
    head: ['head', 'mixamorighead'],
    leftUpperArm: ['upperarml', 'leftupperarm', 'mixamorigleftarm'],
    rightUpperArm: ['upperarmr', 'rightupperarm', 'mixamorigrightarm'],
    leftLowerArm: ['lowerarml', 'leftforearm', 'mixamorigleftforearm'],
    rightLowerArm: ['lowerarmr', 'rightforearm', 'mixamorigrightforearm'],
    leftThigh: ['thighl', 'leftupleg', 'mixamorigleftupleg'],
    rightThigh: ['thighr', 'rightupleg', 'mixamorigrightupleg'],
    leftCalf: ['calfl', 'leftleg', 'mixamorigleftleg'],
    rightCalf: ['calfr', 'rightleg', 'mixamorigrightleg'],
    leftFoot: ['footl', 'leftfoot', 'mixamorigleftfoot'],
    rightFoot: ['footr', 'rightfoot', 'mixamorigrightfoot'],
};

const normalizeBoneName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const loader = new GLTFLoader();
loader.setCrossOrigin('anonymous');

const loadModel = (url: string) => new Promise<GLTF>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
});

let runnerAssetPromise: Promise<GLTF> | null = null;

const loadRunnerAsset = () => {
    runnerAssetPromise ??= loadModel(PRIMARY_MODEL_URL).catch(() => loadModel(LOCAL_FALLBACK_URL));
    return runnerAssetPromise;
};

const prepareModel = (source: THREE.Group, colors: Skin['colors']) => {
    const scene = cloneSkeleton(source) as THREE.Group;
    const tint = new THREE.Color(colors.body);

    scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const prepared = materials.map(sourceMaterial => {
            const material = sourceMaterial.clone();
            if (material instanceof THREE.MeshStandardMaterial) {
                material.roughness = THREE.MathUtils.clamp(material.roughness || 0.7, 0.42, 0.88);
                material.metalness = THREE.MathUtils.clamp(material.metalness || 0, 0, 0.28);
                material.envMapIntensity = 1.15;
                material.color.lerp(tint, 0.12);
                if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
            }
            return material;
        });

        mesh.material = Array.isArray(mesh.material) ? prepared : prepared[0];
    });

    scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(0.1, bounds.max.y - bounds.min.y);
    const scale = TARGET_MODEL_HEIGHT / height;

    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    scene.updateMatrixWorld(true);

    return scene;
};

export const RealisticRunner: React.FC<RealisticRunnerProps> = ({
    colors,
    motion = 'idle',
    reducedMotion = false,
    ...groupProps
}) => {
    const [asset, setAsset] = useState<GLTF | null>(null);
    const modelRoot = useRef<THREE.Group>(null!);
    const bones = useRef<Partial<Record<RunnerBoneName, RigBone>>>({});
    const scratchEuler = useMemo(() => new THREE.Euler(), []);
    const scratchDelta = useMemo(() => new THREE.Quaternion(), []);
    const scratchTarget = useMemo(() => new THREE.Quaternion(), []);

    useEffect(() => {
        let active = true;
        loadRunnerAsset()
            .then(loaded => {
                if (active) setAsset(loaded);
            })
            .catch(() => {
                // The procedural model remains visible when both asset sources fail.
            });
        return () => {
            active = false;
        };
    }, []);

    const modelScene = useMemo(
        () => asset ? prepareModel(asset.scene, colors) : null,
        [asset, colors],
    );

    useEffect(() => {
        if (!modelScene) return;

        const namedObjects = new Map<string, THREE.Object3D>();
        modelScene.traverse(object => namedObjects.set(normalizeBoneName(object.name), object));

        const nextBones: Partial<Record<RunnerBoneName, RigBone>> = {};
        (Object.keys(BONE_ALIASES) as RunnerBoneName[]).forEach(key => {
            const object = BONE_ALIASES[key]
                .map(alias => namedObjects.get(alias))
                .find((candidate): candidate is THREE.Object3D => Boolean(candidate));
            if (object) nextBones[key] = { object, rest: object.quaternion.clone() };
        });
        bones.current = nextBones;

        return () => {
            modelScene.traverse(object => {
                const mesh = object as THREE.Mesh;
                if (!mesh.isMesh) return;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach(material => material.dispose());
            });
        };
    }, [modelScene]);

    useFrame(({ clock }, delta) => {
        if (!modelScene || !modelRoot.current) return;
        const pose = createRunnerPose(clock.elapsedTime, motion, reducedMotion);
        const damping = 1 - Math.exp(-14 * delta);

        const rotateBone = (name: RunnerBoneName, x = 0, y = 0, z = 0) => {
            const bone = bones.current[name];
            if (!bone) return;
            scratchEuler.set(x, y, z, 'XYZ');
            scratchDelta.setFromEuler(scratchEuler);
            scratchTarget.copy(bone.rest).multiply(scratchDelta);
            bone.object.quaternion.slerp(scratchTarget, damping);
        };

        rotateBone('leftThigh', pose.stride);
        rotateBone('rightThigh', -pose.stride);
        rotateBone('leftCalf', pose.leftKnee);
        rotateBone('rightCalf', pose.rightKnee);
        rotateBone('leftFoot', -pose.leftKnee * 0.28);
        rotateBone('rightFoot', -pose.rightKnee * 0.28);
        rotateBone('leftUpperArm', -pose.armSwing);
        rotateBone('rightUpperArm', pose.armSwing);
        rotateBone('leftLowerArm', -pose.elbowFlex);
        rotateBone('rightLowerArm', -pose.elbowFlex);
        rotateBone('spine', pose.torsoLean, pose.torsoTwist);
        rotateBone('pelvis', 0, -pose.torsoTwist * 0.55);
        rotateBone('head', -pose.torsoLean * 0.35, -pose.torsoTwist * 0.4);

        modelRoot.current.position.y = THREE.MathUtils.lerp(modelRoot.current.position.y, pose.bob, damping);
    });

    if (!modelScene) {
        return (
            <ProceduralPlayerModel
                {...groupProps}
                colors={colors}
                motion={motion}
                reducedMotion={reducedMotion}
            />
        );
    }

    return (
        <group {...groupProps}>
            <group ref={modelRoot} rotation-y={Math.PI}>
                <primitive object={modelScene} />

                {/* A restrained technical harness keeps the selected skin visible without masking the imported model. */}
                <group position={[0, 1.72, 0]}>
                    <mesh castShadow position={[0, 0, -0.25]}>
                        <boxGeometry args={[0.52, 0.72, 0.18]} />
                        <meshPhysicalMaterial color={colors.backpack} roughness={0.48} metalness={0.18} clearcoat={0.24} />
                    </mesh>
                    <mesh position={[0, -0.12, -0.35]}>
                        <boxGeometry args={[0.32, 0.055, 0.02]} />
                        <meshBasicMaterial color={colors.hat} toneMapped={false} />
                    </mesh>
                    <mesh position={[0, 0.02, 0.23]}>
                        <boxGeometry args={[0.38, 0.055, 0.025]} />
                        <meshStandardMaterial color={colors.hat} emissive={colors.hat} emissiveIntensity={1.6} toneMapped={false} />
                    </mesh>
                </group>
            </group>
        </group>
    );
};
