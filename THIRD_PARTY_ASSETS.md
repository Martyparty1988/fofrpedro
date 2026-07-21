# Third-party assets

## Mesh2Motion human models

- **Bundled detailed runner:** `public/models/runner-human-sophia.glb`, copied from `human-sophia.glb` at commit `408db807d2d77fd2c96eb2fbd6517a7fa8106070` in [Mesh2Motion/mesh2motion-app](https://github.com/Mesh2Motion/mesh2motion-app/blob/408db807d2d77fd2c96eb2fbd6517a7fa8106070/static/models-variation/human-sophia.glb).
- **Bundled fallback:** `public/models/runner-human-base.glb`, copied from `human-base.glb` at the same pinned commit in [Mesh2Motion/mesh2motion-app](https://github.com/Mesh2Motion/mesh2motion-app/blob/408db807d2d77fd2c96eb2fbd6517a7fa8106070/static/models-variation/human-base.glb).
- **Bundled animations:** `public/models/runner-animations.glb` contains the upstream `Idle_Subtle`, `Sprint`, `Run Jump`, `Backflip`, `Slide`, `Hit_Knockback`, and `Death_D` clips renamed for the game. The clips were extracted from `human-base-animations.glb` and `human-addon-animations.glb` at the same pinned commit. Translation of the rig root was removed so the game loop remains the single source of world-space movement.
- **Reproducibility:** `scripts/extract-runner-animations.mjs` recreates the compact animation bundle from the two upstream GLB files and accepts their paths as command-line arguments.
- **License:** [CC0 1.0 Universal](https://github.com/Mesh2Motion/mesh2motion-app/blob/408db807d2d77fd2c96eb2fbd6517a7fa8106070/LICENSE-CC0.MD). The upstream project states that its 3D models, rigs, and animations are CC0 assets.
- **Local changes:** materials, sizing, shadows, accessories, animation blending, and skin accents are applied at runtime. The two model GLB files are otherwise unchanged.
