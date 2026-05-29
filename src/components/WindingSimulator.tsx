/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TransformerDesignResult, WireGauge } from '../types';
import { Play, Pause, RotateCcw, Plus, Zap, Award } from 'lucide-react';

interface WindingSimulatorProps {
  design: TransformerDesignResult;
}

export const WindingSimulator: React.FC<WindingSimulatorProps> = ({ design }) => {
  const {
    windowHeightHwMm,
    turnsPrimaryTp,
    turnsSecondaryTs,
    wirePrimary,
    wireSecondary,
    inputs: { vPrimary, vSecondary, centerTappedSecondary }
  } = design;

  // States
  const [activeWinding, setActiveWinding] = useState<'primary' | 'secondary'>('primary');
  const [turnsWound, setTurnsWound] = useState<number>(0);
  const [isAutoWinding, setIsAutoWinding] = useState<boolean>(false);
  const [windingSpeed, setWindingSpeed] = useState<number>(5); // turns per second
  const [totalTurnsRequired, setTotalTurnsRequired] = useState<number>(turnsPrimaryTp);
  const [activeWire, setActiveWire] = useState<WireGauge>(wirePrimary);

  // Sync requirements when selection changes
  useEffect(() => {
    if (activeWinding === 'primary') {
      setTotalTurnsRequired(turnsPrimaryTp);
      setActiveWire(wirePrimary);
      setTurnsWound((prev) => Math.min(prev, turnsPrimaryTp));
    } else {
      setTotalTurnsRequired(turnsSecondaryTs);
      setActiveWire(wireSecondary);
      setTurnsWound((prev) => Math.min(prev, turnsSecondaryTs));
    }
  }, [activeWinding, turnsPrimaryTp, turnsSecondaryTs, wirePrimary, wireSecondary]);

  // Handle speed and auto-winding interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isAutoWinding && turnsWound < totalTurnsRequired) {
      intervalId = setInterval(() => {
        setTurnsWound((prev) => {
          const next = prev + 1;
          playClickSound(); // Audio click feedback
          if (next >= totalTurnsRequired) {
            setIsAutoWinding(false);
            if (intervalId) clearInterval(intervalId);
            return totalTurnsRequired;
          }
          return next;
        });
      }, 1000 / windingSpeed);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoWinding, windingSpeed, totalTurnsRequired, turnsWound]);

  // Audio Context for Winding Click Sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playClickSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Low metallic plop
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio context might be blocked by browser security
    }
  };

  // Geometry Packing Calculations (Page 51 & Page 58)
  const turnsPerLayer = Math.max(1, Math.floor(windowHeightHwMm / (activeWire.diameterMm || 1.0)));
  const layerCount = Math.ceil(turnsWound / turnsPerLayer);
  const currentLayerActiveTurns = turnsWound % turnsPerLayer || (turnsWound > 0 ? turnsPerLayer : 0);

  // Live metrics
  // Mean length per turn
  const layerOffset = layerCount * activeWire.diameterMm * 0.5;
  const lmtMm = Math.PI * (design.circDiameterMm + 4 + layerOffset);
  const liveLengthM = (turnsWound * lmtMm) * 1e-3;
  const liveResistanceOhm = liveLengthM * activeWire.resistanceOhmPerMeter;
  const liveWeightKg = (liveLengthM * activeWire.weightKgPerKm) * 1e-3;

  const progressPercent = Math.min(100, (turnsWound / totalTurnsRequired) * 100);

  // Manual button click
  const handleSingleTurn = () => {
    if (turnsWound < totalTurnsRequired) {
      setTurnsWound((prev) => prev + 1);
      playClickSound();
    }
  };

  const handleReset = () => {
    setIsAutoWinding(false);
    setTurnsWound(0);
  };

  const handleFillAll = () => {
    setTurnsWound(totalTurnsRequired);
    playClickSound();
  };

  return (
    <div id="winding-simulator-panel" className="bg-[#1a1d23] border border-slate-800 rounded p-4 text-white flex flex-col gap-4 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <Zap className="text-amber-500 w-4 h-4 animate-pulse" />
            Real-Time Coil Winding Simulator
          </h3>
          <p className="text-[10px] text-slate-400">
            Interactive winding assembly builder with layered wire packing
          </p>
        </div>

        {/* Coil toggle */}
        <div className="flex bg-slate-950 p-1 rounded border border-slate-800 self-start">
          <button
            onClick={() => { setActiveWinding('primary'); handleReset(); }}
            className={`px-3 py-1 text-xs rounded transition-all font-bold uppercase tracking-wider cursor-pointer ${
              activeWinding === 'primary'
                ? 'bg-amber-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Primary ({vPrimary}V)
          </button>
          <button
            onClick={() => { setActiveWinding('secondary'); handleReset(); }}
            className={`px-3 py-1 text-xs rounded transition-all font-bold uppercase tracking-wider cursor-pointer ${
              activeWinding === 'secondary'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Secondary ({vSecondary}V)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Side: Bobbin visual rendering */}
        <div className="bg-[#0f1115] border border-slate-800 p-3 rounded flex flex-col items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">Spindle Rotation Layer Grid</span>
          
          <div className="relative w-full aspect-[4/3] max-w-[260px] bg-slate-950 rounded overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Bobbin side plates */}
            <div className="absolute top-2 bottom-2 left-4 w-3 bg-slate-700/80 rounded border-r border-slate-600"></div>
            <div className="absolute top-2 bottom-2 right-4 w-3 bg-slate-700/80 rounded border-l border-slate-600"></div>
            
            {/* Central Spindle Core cylinder */}
            <div className="absolute top-7 bottom-7 left-7 right-7 bg-slate-800/50 rounded-md border-y border-slate-700 flex flex-col items-center justify-center">
              {turnsWound === 0 && (
                <span className="text-[10px] text-slate-500 font-mono text-center px-4">
                  EMPTY BOBBIN<br />Ready to wrap
                </span>
              )}
            </div>

            {/* Rotated windings wraps overlay (SVG map inside boundaries) */}
            <svg className={`w-[180px] h-full ${isAutoWinding ? 'animate-pulse' : ''}`} viewBox="0 0 180 180">
              <g transform="translate(10, 10)">
                {/* We map a spiral or stacked rows of wire representation */}
                {Array.from({ length: Math.min(5, layerCount) }).map((_, layerIdx) => {
                  const isCurrent = layerIdx === layerCount - 1;
                  const turnsToDraw = isCurrent ? currentLayerActiveTurns : turnsPerLayer;
                  const wireColor = activeWinding === 'primary' ? '#d97706' : '#4f46e5';
                  const layerY = 30 + layerIdx * 15;

                  return (
                    <g key={layerIdx} opacity={1.0 - layerIdx * 0.15}>
                      {Array.from({ length: Math.min(32, turnsToDraw) }).map((_, turnIdx) => {
                        const wireX = 15 + turnIdx * 4.3;
                        return (
                          <rect
                            key={turnIdx}
                            x={wireX}
                            y={layerY}
                            width="3"
                            height="10"
                            rx="1"
                            fill={wireColor}
                            stroke="#ffffff"
                            strokeWidth="0.1"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Simulated rotation lines */}
            {isAutoWinding && (
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none animate-[pulse_0.4s_infinite]"></div>
            )}
            
            {/* Completion badge */}
            {turnsWound >= totalTurnsRequired && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-1 p-4 animate-fade-in">
                <Award className="text-emerald-400 w-12 h-12" />
                <span className="text-xs font-semibold text-emerald-400">Coil Winding Perfected</span>
                <span className="text-[10px] text-slate-400 font-mono">Total {turnsWound} turns finished</span>
              </div>
            )}
          </div>

          <div className="w-full">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
              <span>Winding Progress</span>
              <span>{turnsWound} / {totalTurnsRequired} t ({progressPercent.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-150 ${activeWinding === 'primary' ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            {activeWinding === 'secondary' && centerTappedSecondary && (
              <div className="text-[10px] bg-slate-950/80 px-2.5 py-1.5 rounded border border-indigo-950/50 flex justify-between items-center font-mono text-indigo-400 leading-none">
                <span>Center Tap (50% mark):</span>
                <span className={`font-bold uppercase tracking-wider ${turnsWound >= Math.round(totalTurnsRequired / 2) ? 'text-emerald-400' : 'text-indigo-400'}`}>
                  {Math.round(totalTurnsRequired / 2)} turns {turnsWound >= Math.round(totalTurnsRequired / 2) ? '✓ REACHED' : '◯ WINDING...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Control systems and indicators */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-col p-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Active Wire Gauge</span>
              <span className="text-sm font-semibold text-slate-200">{activeWire.name}</span>
              <span className="text-[11px] font-mono text-slate-400">Ø {activeWire.diameterMm} mm</span>
            </div>
            <div className="flex flex-col p-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Turns/Layer Limit</span>
              <span className="text-sm font-semibold text-slate-200">{turnsPerLayer} turns</span>
              <span className="text-[11px] font-mono text-slate-400">{layerCount} active layers</span>
            </div>
            <div className="flex flex-col p-1 border-t border-slate-800/50 pt-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Live Wire Length</span>
              <span className="text-sm font-semibold text-indigo-400">{liveLengthM.toFixed(2)} m</span>
            </div>
            <div className="flex flex-col p-1 border-t border-slate-800/50 pt-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Live Resistance</span>
              <span className="text-sm font-semibold text-indigo-400">{liveResistanceOhm.toFixed(3)} Ω</span>
            </div>
            <div className="flex flex-col col-span-2 p-1 border-t border-slate-800/50 pt-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Accumulated Copper weight</span>
              <span className="text-sm font-semibold text-emerald-400">{(liveWeightKg * 1000).toFixed(1)} grams</span>
            </div>
          </div>

          {/* Core controls */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleSingleTurn}
                disabled={turnsWound >= totalTurnsRequired}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-slate-700 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-slate-300" />
                Manual Turn
              </button>

              <button
                onClick={() => setIsAutoWinding(!isAutoWinding)}
                disabled={turnsWound >= totalTurnsRequired}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded text-xs font-semibold ${
                  isAutoWinding 
                    ? 'bg-rose-600 hover:bg-rose-500 border border-rose-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white'
                } disabled:opacity-50`}
              >
                {isAutoWinding ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isAutoWinding ? 'Pause Auto' : 'Auto Wind'}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-xs text-slate-400 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Spindle
              </button>
              <button
                onClick={handleFillAll}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-xs text-slate-400 font-medium"
              >
                Skip to Done
              </button>
            </div>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider w-12 shrink-0">WIND SPEED</span>
            <input
              type="range"
              min="1"
              max="20"
              value={windingSpeed}
              onChange={(e) => setWindingSpeed(parseInt(e.target.value))}
              disabled={turnsWound >= totalTurnsRequired}
              className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-semibold text-slate-350 shrink-0 w-8 text-right">{windingSpeed} t/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
