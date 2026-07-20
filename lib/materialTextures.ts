import * as THREE from 'three';

export interface AsphaltTextures {
    color: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
}

const seededRandom = (seed: number) => {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
};

const canvas2d = (size: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable.');
    return { canvas, context };
};

const textureFromCanvas = (
    canvas: HTMLCanvasElement,
    repeat: [number, number],
    color = false,
) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
    texture.anisotropy = 4;
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

export const createAsphaltTextures = (): AsphaltTextures => {
    const size = 256;
    const random = seededRandom(0x50454452);
    const colorLayer = canvas2d(size);
    const roughnessLayer = canvas2d(size);

    colorLayer.context.fillStyle = '#171c22';
    colorLayer.context.fillRect(0, 0, size, size);
    roughnessLayer.context.fillStyle = '#d2d2d2';
    roughnessLayer.context.fillRect(0, 0, size, size);

    for (let index = 0; index < 5200; index++) {
        const x = Math.floor(random() * size);
        const y = Math.floor(random() * size);
        const shade = 20 + Math.floor(random() * 28);
        const alpha = 0.18 + random() * 0.28;
        colorLayer.context.fillStyle = `rgba(${shade}, ${shade + 3}, ${shade + 5}, ${alpha})`;
        colorLayer.context.fillRect(x, y, random() > 0.86 ? 2 : 1, random() > 0.9 ? 2 : 1);

        const roughness = 145 + Math.floor(random() * 95);
        roughnessLayer.context.fillStyle = `rgb(${roughness}, ${roughness}, ${roughness})`;
        roughnessLayer.context.fillRect(x, y, 1, 1);
    }

    colorLayer.context.strokeStyle = 'rgba(4, 7, 10, 0.48)';
    colorLayer.context.lineWidth = 1.2;
    roughnessLayer.context.strokeStyle = '#8b8b8b';
    roughnessLayer.context.lineWidth = 2;
    for (let crack = 0; crack < 9; crack++) {
        const startX = random() * size;
        const startY = random() * size;
        for (const context of [colorLayer.context, roughnessLayer.context]) {
            context.beginPath();
            context.moveTo(startX, startY);
            for (let point = 1; point < 6; point++) {
                context.lineTo(startX + (random() - 0.5) * 42, startY + point * 9);
            }
            context.stroke();
        }
    }

    return {
        color: textureFromCanvas(colorLayer.canvas, [5, 34], true),
        roughness: textureFromCanvas(roughnessLayer.canvas, [5, 34]),
    };
};

export const createPavingTexture = () => {
    const size = 256;
    const { canvas, context } = canvas2d(size);
    const random = seededRandom(0x50524147);
    context.fillStyle = '#737b84';
    context.fillRect(0, 0, size, size);

    const tileWidth = 32;
    const tileHeight = 20;
    for (let row = -1; row < size / tileHeight + 1; row++) {
        for (let column = -1; column < size / tileWidth + 1; column++) {
            const offset = row % 2 === 0 ? 0 : tileWidth / 2;
            const x = column * tileWidth + offset;
            const y = row * tileHeight;
            const shade = 92 + Math.floor(random() * 30);
            context.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 9})`;
            context.fillRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2);
            context.strokeStyle = 'rgba(25, 31, 37, 0.55)';
            context.strokeRect(x + 0.5, y + 0.5, tileWidth - 1, tileHeight - 1);
        }
    }

    return textureFromCanvas(canvas, [4, 48], true);
};

export const createFacadeTexture = (seed: number) => {
    const size = 256;
    const { canvas, context } = canvas2d(size);
    const random = seededRandom(seed);
    context.fillStyle = '#b8b4af';
    context.fillRect(0, 0, size, size);

    for (let index = 0; index < 1800; index++) {
        const shade = 125 + Math.floor(random() * 70);
        context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.035 + random() * 0.08})`;
        context.fillRect(random() * size, random() * size, 1 + random() * 3, 1 + random() * 5);
    }

    context.lineWidth = 1;
    for (let y = 18; y < size; y += 22) {
        context.strokeStyle = 'rgba(63, 68, 73, 0.28)';
        context.beginPath();
        context.moveTo(0, y + 0.5);
        context.lineTo(size, y + 0.5);
        context.stroke();
        const offset = (Math.floor(y / 22) % 2) * 18;
        for (let x = offset; x < size; x += 36) {
            context.beginPath();
            context.moveTo(x + 0.5, y - 21);
            context.lineTo(x + 0.5, y);
            context.stroke();
        }
    }

    const grime = context.createLinearGradient(0, 0, 0, size);
    grime.addColorStop(0, 'rgba(15, 20, 24, 0.02)');
    grime.addColorStop(1, 'rgba(12, 18, 22, 0.35)');
    context.fillStyle = grime;
    context.fillRect(0, 0, size, size);

    return textureFromCanvas(canvas, [3, 5], true);
};

export const createSignTexture = (label: string, accent: string) => {
    const { canvas, context } = canvas2d(512);
    const gradient = context.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#09111b');
    gradient.addColorStop(1, '#182433');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    context.strokeStyle = accent;
    context.lineWidth = 18;
    context.strokeRect(18, 18, 476, 476);
    context.fillStyle = '#eef8ff';
    context.font = '700 70px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, 256, 256, 430);
    return textureFromCanvas(canvas, [1, 1], true);
};
