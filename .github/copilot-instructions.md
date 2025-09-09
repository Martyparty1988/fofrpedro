# FofrPedro - 3D Endless Runner Game AI Agent Guide

This document provides essential knowledge for AI agents working with the FofrPedro codebase, a React-based 3D endless runner game using Three.js, React Three Fiber, and TypeScript.

## Project Architecture

### Core Components

1. **Game Scene (`components/game3d/GameScene3D.tsx`)**
   - Main 3D scene orchestrator
   - Handles camera movement, fog effects, and scene composition
   - Key components: Player3D, Road, Environment, GameItems, EffectsManager, Rain

2. **Game Logic (`hooks/useGameLogic.ts`)**
   - Core game mechanics and state management
   - Handles spawning patterns, collisions, power-ups
   - Manages game speed, score, and difficulty progression

3. **Asset Management**
   - Game constants: `constants/gameConstants.ts`
   - Audio management: `lib/audioManager.ts`
   - Storage management: `lib/storageManager.ts`

### Key Patterns and Conventions

1. **Component Structure**
   - Game components are split between UI (`components/`) and 3D elements (`components/game3d/`)
   - Each component has a clear, single responsibility
   - Props interfaces are defined at the top of component files

2. **State Management**
   - Game state is centralized in `useGameLogic` hook
   - Uses TypeScript interfaces for type safety (see `types.ts`)
   - State updates follow immutable patterns

3. **Game Objects and Spawning**
   - Objects spawn based on score-dependent patterns
   - Pattern definitions in `useGameLogic.ts` control difficulty progression
   - Collectibles spawn in available lanes after obstacle placement

## Development Workflow

1. **Local Development**
   ```bash
   npm install
   npm run dev
   ```

2. **Project Structure**
   - Components: UI and 3D game elements
   - Constants: Game configuration and assets
   - Hooks: Game logic and state management
   - Lib: Utility services

3. **Key TypeScript Configurations**
   - Target: ES2022
   - Module: ESNext
   - Strict mode enabled
   - Path alias: `@/*` maps to root

## Best Practices

1. **Performance**
   - Use React.memo for pure components
   - Keep Three.js objects in refs
   - Use useFrame for animation updates

2. **State Updates**
   - Follow immutable update patterns
   - Batch related state changes
   - Use functional updates for state depending on previous values

3. **Type Safety**
   - Define interfaces for all props and state
   - Use strict TypeScript checks
   - Avoid any unless absolutely necessary

## Common Integration Points

1. **Audio System**
   - Managed through `audioManager.ts`
   - Volume controlled via settings
   - Sound effects tied to game events

2. **Game Settings**
   - Visual effects (camera shake, reduced motion)
   - Audio volume control
   - Haptic feedback support

## Game Mechanics Reference

1. **Player Actions**
   - Lane movement (left/right)
   - Flip (with cooldown)
   - Slide (with cooldown)

2. **Power-ups**
   - Speed boost
   - Invincibility
   - Health (Cevko)
   - Score (Lajna)

3. **Difficulty Progression**
   - Score-based pattern unlocks
   - Speed increases over time
   - Pattern weights control spawn frequency
