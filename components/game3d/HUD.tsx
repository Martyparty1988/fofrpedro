import React from 'react';
import { GameEffect, GameState, GameObjectType } from '../../types';
import { HeartIcon, SpeedIcon, ShieldIcon, FlipIcon, PauseIcon, SlideIcon } from '../../constants/assets';
import { POWERUP_DURATION, FLIP_COOLDOWN, FLIP_DURATION, SLIDE_COOLDOWN, SLIDE_DURATION } from '../../constants/gameConstants';
import { getGameMessageDurationMs } from '../../lib/gamePresentation';

interface HUDProps {
    gameState: GameState;
    onPause: () => void;
}

const PowerUpIndicator: React.FC<{ type: GameObjectType.SpeedBoost | GameObjectType.Invincibility, timeLeft: number }> = ({ type, timeLeft }) => {
    const Icon = type === GameObjectType.SpeedBoost ? SpeedIcon : ShieldIcon;
    const label = type === GameObjectType.SpeedBoost ? 'BOOST' : 'ŠTÍT';
    const progress = Math.max(0, Math.min(100, (timeLeft / POWERUP_DURATION) * 100));

    return (
        <div className="hud-chip flex min-w-28 items-center gap-2 px-2.5 py-2" aria-label={`${label}, zbývá ${Math.ceil(timeLeft)} sekund`}>
            <Icon className="h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-bold tracking-[0.12em] text-gray-300">
                    <span>{label}</span>
                    <span className="tabular-nums text-cyan-200">{Math.ceil(timeLeft)} s</span>
                </div>
                <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10 sm:w-20">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

interface AbilityIndicatorProps {
    label: string;
    cooldown: number;
    maxCooldown: number;
    icon: React.ComponentType<{ className?: string }>;
    readyClassName: string;
    progressClassName: string;
}

const AbilityIndicator: React.FC<AbilityIndicatorProps> = ({
    label,
    cooldown,
    maxCooldown,
    icon: Icon,
    readyClassName,
    progressClassName,
}) => {
    const isReady = cooldown <= 0.001;
    const progress = isReady ? 100 : Math.max(0, Math.min(100, ((maxCooldown - cooldown) / maxCooldown) * 100));

    return (
        <div className={`hud-chip flex min-w-28 items-center gap-2 px-2.5 py-2 transition-opacity duration-200 ${isReady ? 'opacity-100' : 'opacity-60'}`} aria-label={`${label}: ${isReady ? 'připraveno' : 'obnovuje se'}`}>
            <Icon className={`h-5 w-5 shrink-0 ${isReady ? readyClassName : 'text-gray-500'}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-bold tracking-[0.12em] text-gray-300">
                    <span>{label}</span>
                    <span className={isReady ? readyClassName : 'text-gray-500'}>{isReady ? 'OK' : '…'}</span>
                </div>
                <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10 sm:w-20">
                    <div className={`h-full rounded-full ${isReady ? progressClassName : 'bg-gray-500'}`} style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

const GameMessage: React.FC<{ effect: GameEffect & { text: string } }> = ({ effect }) => {
    const style = {
        '--message-duration': `${getGameMessageDurationMs(effect.text)}ms`,
    } as React.CSSProperties;

    return (
        <div className="game-message" style={style} role="status">
            <span className="game-message__signal" aria-hidden="true" />
            <div className="min-w-0">
                <span className="game-message__speaker">PEDRO</span>
                <p className="game-message__text">{effect.text}</p>
            </div>
        </div>
    );
};

const findActiveMessage = (effects: GameEffect[]): (GameEffect & { text: string }) | undefined => {
    for (let index = effects.length - 1; index >= 0; index--) {
        const effect = effects[index];
        if (effect.type === 'speech-bubble' && effect.text) return effect as GameEffect & { text: string };
    }
    return undefined;
};

export const HUD: React.FC<HUDProps> = ({ gameState, onPause }) => {
    const activeMessage = findActiveMessage(gameState.effects);

    return (
        <div className="game-hud pointer-events-none absolute left-0 top-0 z-10 flex h-full w-full flex-col justify-between text-white">
            <div className="flex justify-between items-start">
                <div className="hud-panel flex min-w-28 flex-col items-start rounded-2xl px-3 py-2.5 sm:min-w-36 sm:px-4 sm:py-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] text-gray-400 sm:text-xs">SKÓRE</span>
                    <span className="mt-0.5 text-2xl font-black leading-none tracking-tight tabular-nums sm:text-4xl">{Math.floor(gameState.score)}</span>
                    <span className="mt-1.5 text-[10px] font-semibold tracking-[0.12em] text-cyan-300 sm:text-xs">TEMPO {gameState.gameSpeed.toFixed(1)}</span>
                </div>

                <button type="button" aria-label="Pozastavit hru" onClick={onPause} className="hud-control pointer-events-auto grid h-12 w-12 place-items-center rounded-full transition-colors duration-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                    <PauseIcon className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            <div className="game-message-region" aria-live="polite" aria-atomic="true">
                {activeMessage && <GameMessage key={activeMessage.id} effect={activeMessage} />}
            </div>

            <div className="flex justify-between items-end">
                <div className="hud-panel flex gap-1.5 rounded-2xl p-2.5 sm:gap-2 sm:p-3" aria-label={`Zdraví ${gameState.player.health} z 5`}>
                    {Array.from({ length: gameState.player.health }).map((_, i) => (
                        <HeartIcon key={i} className={`h-5 w-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.45)] sm:h-7 sm:w-7 ${gameState.player.damageCooldown > 0 ? 'animate-pulse' : ''}`} aria-hidden="true" />
                    ))}
                    {Array.from({ length: 5 - gameState.player.health }).map((_, i) => (
                         <HeartIcon key={i} className="h-5 w-5 text-white/10 sm:h-7 sm:w-7" aria-hidden="true" />
                    ))}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <AbilityIndicator
                        label="SALTO"
                        cooldown={gameState.player.flipCooldown}
                        maxCooldown={FLIP_COOLDOWN + FLIP_DURATION}
                        icon={FlipIcon}
                        readyClassName="text-fuchsia-400"
                        progressClassName="bg-fuchsia-500"
                    />
                    <AbilityIndicator
                        label="SKLUZ"
                        cooldown={gameState.player.slideCooldown}
                        maxCooldown={SLIDE_COOLDOWN + SLIDE_DURATION}
                        icon={SlideIcon}
                        readyClassName="text-cyan-400"
                        progressClassName="bg-cyan-500"
                    />
                    {gameState.activePowerUps.map(p => (
                        <PowerUpIndicator key={p.type} type={p.type} timeLeft={p.timeLeft} />
                    ))}
                </div>
            </div>
        </div>
    );
};
