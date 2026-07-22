import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

globalThis.self = globalThis;
globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;
    onerror = null;

    readAsArrayBuffer(blob) {
        blob.arrayBuffer()
            .then(result => {
                this.result = result;
                this.onloadend?.();
            })
            .catch(error => this.onerror?.(error));
    }

    readAsDataURL(blob) {
        blob.arrayBuffer()
            .then(result => {
                const base64 = Buffer.from(result).toString('base64');
                this.result = `data:${blob.type};base64,${base64}`;
                this.onloadend?.();
            })
            .catch(error => this.onerror?.(error));
    }
};

const parseGlb = path => new Promise((resolve, reject) => {
    const bytes = fs.readFileSync(path);
    new GLTFLoader().parse(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        '',
        resolve,
        reject,
    );
});

const [basePath, addonPath, outputPath = 'public/models/runner-animations.glb'] = process.argv.slice(2);
if (!basePath || !addonPath) {
    throw new Error('Usage: node scripts/extract-runner-animations.mjs <base-animations.glb> <addon-animations.glb> [output.glb]');
}

const [base, addon] = await Promise.all([
    parseGlb(basePath),
    parseGlb(addonPath),
]);

const wanted = new Map([
    ['Idle_Subtle', 'idle'],
    ['Sprint', 'run'],
    ['Run Jump', 'jump'],
    ['Backflip', 'flip'],
    ['Slide', 'slide'],
    ['Hit_Knockback', 'hit'],
    ['Death_D', 'death'],
]);
const sourceClips = [...base.animations, ...addon.animations];
const animations = [];

for (const [sourceName, targetName] of wanted) {
    const clip = sourceClips.find(candidate => candidate.name === sourceName);
    if (!clip) throw new Error(`Missing animation: ${sourceName}`);
    const cloned = clip.clone();
    cloned.name = targetName;
    // World-space locomotion is owned by the game loop. Keeping root translation
    // from the source clips would make the rendered runner drift away from its
    // collision box after every animation transition.
    cloned.tracks = cloned.tracks.filter(track => track.name !== 'root.position');
    animations.push(cloned);
}

const scene = base.scene.clone(true);
const meshes = [];
scene.traverse(object => {
    if (object instanceof THREE.Mesh) meshes.push(object);
});
meshes.forEach(mesh => mesh.parent?.remove(mesh));

const exported = await new Promise((resolve, reject) => {
    new GLTFExporter().parse(
        scene,
        resolve,
        reject,
        { binary: true, animations, onlyVisible: false },
    );
});

if (!(exported instanceof ArrayBuffer)) throw new Error('Expected binary GLB output.');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(exported));
console.log(`Exported ${animations.length} clips (${exported.byteLength} bytes).`);
