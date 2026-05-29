/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TransformerDesignResult } from '../types';

interface CoreVisualizerProps {
  design: TransformerDesignResult;
}

export const CoreVisualizer: React.FC<CoreVisualizerProps> = ({ design }) => {
  const {
    inputs: { coreStyle, coreShape },
    coreWidthAMm,
    coreDepthBMm,
    windowWidthWwMm,
    windowHeightHwMm,
    yokeHeightHyMm,
    yokeLengthWMm,
    overallHeightHMm,
    centerDistanceDMm,
    circDiameterMm,
    turnsPrimaryTp,
    turnsSecondaryTs,
    wirePrimary,
    wireSecondary
  } = design;

  // Let's create an adaptive scale factor to fit within a 340px SVG container
  const maxDim = Math.max(yokeLengthWMm, overallHeightHMm);
  const scale = 240 / (maxDim || 300); // Pad to fit smoothly
  const ox = (280 - yokeLengthWMm * scale) / 2;
  const oy = (280 - overallHeightHMm * scale) / 2;

  // Values in SVG scale coordinates
  const sW = yokeLengthWMm * scale;
  const sH = overallHeightHMm * scale;
  const sA = coreWidthAMm * scale;
  const sHy = yokeHeightHyMm * scale;
  const sWw = windowWidthWwMm * scale;
  const sHw = windowHeightHwMm * scale;
  const sD = centerDistanceDMm * scale;

  return (
    <div id="v-core-visualizer" className="bg-[#1a1d23] border border-slate-800 rounded p-4 text-white flex flex-col gap-4 select-none shadow-xl duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Transformer Assembly Blueprint
          </h3>
          <p className="text-[10px] text-slate-400 capitalize">
            {coreStyle.replace('-', ' ')} • {coreShape.replace('-', ' ')} geometry
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700">
          Scale: 1:{(1 / scale).toFixed(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* VIEW 1: VERTICAL CROSS-SECTION */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Elevation view (vertical cross-section)</span>
          <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 280 280">
              <defs>
                <pattern id="winding-stripes-pri" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="4" height="8" fill="#f59e0b" fillOpacity="0.85" />
                  <rect x="4" width="4" height="8" fill="#d97706" fillOpacity="0.85" />
                </pattern>
                <pattern id="winding-stripes-sec" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                  <rect width="3" height="6" fill="#6366f1" fillOpacity="0.8" />
                  <rect x="3" width="3" height="6" fill="#4f46e5" fillOpacity="0.8" />
                </pattern>
                <linearGradient id="iron-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              <g transform={`translate(${ox}, ${oy})`}>
                {/* 1. DRAW OUTER CONTAINER YOKE BACKPLANE / IRON CORE */}
                {coreStyle === '1p-core' && (
                  <g>
                    {/* Entire Frame Outer Loop */}
                    <rect x="0" y="0" width={sW} height={sH} fill="url(#iron-gradient)" stroke="#64748b" strokeWidth="1.5" rx="2" />
                    {/* Inner Window cut out */}
                    <rect x={sA} y={sHy} width={sWw} height={sHw} fill="#020617" stroke="#475569" strokeWidth="1" />
                    
                    {/* WINDINGS ON CORE LIMBS */}
                    {/* Primary Winding on Left Limb (nearer to Core) */}
                    <rect x={sA - sA*0.25} y={sHy + sHw*0.08} width={sA*0.25} height={sHw*0.84} fill="url(#winding-stripes-pri)" rx="1" />
                    {/* Secondary Winding on Left Limb (outer layer) */}
                    <rect x={sA - sA*0.5} y={sHy + sHw*0.12} width={sA*0.25} height={sHw*0.76} fill="url(#winding-stripes-sec)" rx="1" />

                    {/* Windings on Right Limb */}
                    {/* Primary Winding (inner) */}
                    <rect x={sA + sWw} y={sHy + sHw*0.08} width={sA*0.25} height={sHw*0.84} fill="url(#winding-stripes-pri)" rx="1" />
                    {/* Secondary Winding (outer) */}
                    <rect x={sA + sWw + sA*0.25} y={sHy + sHw*0.12} width={sA*0.25} height={sHw*0.76} fill="url(#winding-stripes-sec)" rx="1" />
                  </g>
                )}

                {coreStyle === '1p-shell' && (
                  <g>
                    {/* Core boundary */}
                    <rect x="0" y="0" width={sW} height={sH} fill="url(#iron-gradient)" stroke="#64748b" strokeWidth="1.5" rx="2" />
                    {/* Left window cut out */}
                    <rect x={sA} y={sA} width={sWw} height={sHw} fill="#020617" stroke="#475569" strokeWidth="1" />
                    {/* Right window cut out */}
                    <rect x={sA + sWw + sA*2} y={sA} width={sWw} height={sHw} fill="#020617" stroke="#475569" strokeWidth="1" />
                    
                    {/* Windings on center limb (Central leg width = 2a) */}
                    {/* Primary Inner Ring (encasing central limb on both windows) */}
                    <rect x={sA + sWw - sWw*0.3} y={sA + sHw*0.08} width={sWw*0.3} height={sHw*0.84} fill="url(#winding-stripes-pri)" rx="1" />
                    <rect x={sA + sWw + sA*2} y={sA + sHw*0.08} width={sWw*0.3} height={sHw*0.84} fill="url(#winding-stripes-pri)" rx="1" />
                    
                    {/* Secondary Outer Ring */}
                    <rect x={sA + sWw - sWw*0.6} y={sA + sHw*0.15} width={sWw*0.3} height={sHw*0.7} fill="url(#winding-stripes-sec)" rx="1" />
                    <rect x={sA + sWw + sA*2 + sWw*0.3} y={sA + sHw*0.15} width={sWw*0.3} height={sHw*0.7} fill="url(#winding-stripes-sec)" rx="1" />
                  </g>
                )}

                {coreStyle === '3p-core' && (
                  <g>
                    {/* Shell perimeter */}
                    <rect x="0" y="0" width={sW} height={sH} fill="url(#iron-gradient)" stroke="#64748b" strokeWidth="1.5" rx="2" />
                    {/* Left window */}
                    <rect x={sA} y={sHy} width={sWw} height={sHw} fill="#020617" stroke="#475569" strokeWidth="1" />
                    {/* Right window */}
                    <rect x={sA + sWw + sA} y={sHy} width={sWw} height={sHw} fill="#020617" stroke="#475569" strokeWidth="1" />

                    {/* Windings on Leg 1 */}
                    <rect x={sA - sA*0.2} y={sHy + sHw*0.08} width={sA*0.2} height={sHw*0.84} fill="url(#winding-stripes-pri)" />
                    <rect x={sA} y={sHy + sHw*0.08} width={sWw*0.25} height={sHw*0.84} fill="url(#winding-stripes-pri)" />
                    <rect x={sA + sWw*0.25} y={sHy + sHw*0.15} width={sWw*0.2} height={sHw*0.7} fill="url(#winding-stripes-sec)" />

                    {/* Windings on Leg 2 (Center) */}
                    <rect x={sA + sWw + sA - sWw*0.45} y={sHy + sHw*0.15} width={sWw*0.2} height={sHw*0.7} fill="url(#winding-stripes-sec)" />
                    <rect x={sA + sWw + sA - sWw*0.25} y={sHy + sHw*0.08} width={sWw*0.25} height={sHw*0.84} fill="url(#winding-stripes-pri)" />
                    <rect x={sA + sWw + sA} y={sHy + sHw*0.08} width={sWw*0.25} height={sHw*0.84} fill="url(#winding-stripes-pri)" />
                    <rect x={sA + sWw + sA + sWw*0.25} y={sHy + sHw*0.15} width={sWw*0.2} height={sHw*0.7} fill="url(#winding-stripes-sec)" />

                    {/* Windings on Leg 3 */}
                    <rect x={sW - sA - sWw*0.45} y={sHy + sHw*0.15} width={sWw*0.2} height={sHw*0.7} fill="url(#winding-stripes-sec)" />
                    <rect x={sW - sA - sWw*0.25} y={sHy + sHw*0.08} width={sWw*0.25} height={sHw*0.84} fill="url(#winding-stripes-pri)" />
                    <rect x={sW - sA} y={sHy + sHw*0.08} width={sA*0.2} height={sHw*0.84} fill="url(#winding-stripes-pri)" />
                  </g>
                )}

                {/* Default Fallback for 3p Shell */}
                {coreStyle === '3p-shell' && (
                  <rect x="0" y="0" width={sW} height={sH} fill="url(#iron-gradient)" stroke="#64748b" rx="2" />
                )}

                {/* DIMENSION ANNOTATION ARROWS */}
                {/* 1. Dimension Hw - Height of Window */}
                <line x1={sW * 0.5} y1={sHy} x2={sW * 0.5} y2={sHy + sHw} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,3" />
                <polygon points={`${sW*0.5},${sHy} ${sW*0.5-3},${sHy+7} ${sW*0.5+3},${sHy+7}`} fill="#22d3ee" />
                <polygon points={`${sW*0.5},${sHy+sHw} ${sW*0.5-3},${sHy+sHw-7} ${sW*0.5+3},${sHy+sHw-7}`} fill="#22d3ee" />
                
                {/* 2. Dimension Ww - Width of Window */}
                {coreStyle === '1p-core' && (
                  <g>
                    <line x1={sA} y1={sHy + sHw*0.5} x2={sA + sWw} y2={sHy + sHw*0.5} stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2,2" />
                    <polygon points={`${sA},${sHy+sHw*0.5} ${sA+6},${sHy+sHw*0.5-2.5} ${sA+6},${sHy+sHw*0.5+2.5}`} fill="#38bdf8" />
                    <polygon points={`${sA+sWw},${sHy+sHw*0.5} ${sA+sWw-6},${sHy+sHw*0.5-2.5} ${sA+sWw-6},${sHy+sHw*0.5+2.5}`} fill="#38bdf8" />
                  </g>
                )}

                {/* 3. Dimension a - Width of leg */}
                <line x1="0" y1={sH*0.9} x2={sA} y2={sH*0.9} stroke="#a7f3d0" strokeWidth="1" strokeDasharray="2,2" />
                <polygon points={`0,${sH*0.9} 5,${sH*0.9-2} 5,${sH*0.9+2}`} fill="#a7f3d0" />
                <polygon points={`${sA},${sH*0.9} ${sA-5},${sH*0.9-2} ${sA-5},${sH*0.9+2}`} fill="#a7f3d0" />
              </g>
            </svg>
            
            {/* Overlay indicators on hover */}
            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-cyan-400 capitalize flex flex-col">
              <span>W = {yokeLengthWMm} mm</span>
              <span>H = {overallHeightHMm} mm</span>
              <span>Hw = {windowHeightHwMm} mm</span>
              <span>Ww = {windowWidthWwMm} mm</span>
            </div>
          </div>
        </div>

        {/* VIEW 2: STEPPED CORE SECTION GRAPH */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Core shape (horizontal cross-section)</span>
          <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <defs>
                <radialGradient id="coil-radial" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#d97706" stopOpacity="0.1" />
                  <stop offset="90%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
                </radialGradient>
              </defs>

              {/* 1. Draw Circumscribing Outer Circle (Wrapping Coil footprint) */}
              <circle cx="100" cy="100" r="75" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3,3" />
              {/* Shaded Coil Insulation Area */}
              <circle cx="100" cy="100" r="82" fill="url(#coil-radial)" stroke="#ea580c" strokeWidth="1.2" />

              {/* 2. SPECIFIC STEPPED CORE OUTLINES */}
              {coreShape === 'square' && (
                // Diagonal constraint square on 75 ratio (side = sqrt(2) * r = 1.414 * 75 / sqrt(2) * 53)
                <rect x="47" y="47" width="106" height="106" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              )}

              {coreShape === 'cruciform' && (
                <g>
                  {/* Two columns intersecting (Page 45) */}
                  {/* Base dimensions (a=0.85d, b=0.53d. r=75 => d=150. a = 0.85*150 = 127.5, b = 0.53*150 = 79.5) */}
                  {/* Visual scale matching max width inside 150 boundary */}
                  <rect x="36" y="60" width="128" height="80" fill="#475569" stroke="#94a3b8" strokeWidth="1.2" />
                  <rect x="60" y="36" width="80" height="128" fill="#475569" stroke="#94a3b8" strokeWidth="1.2" />
                </g>
              )}

              {coreShape === '3-stepped' && (
                <g>
                  {/* Center slab */}
                  <rect x="33" y="66" width="134" height="68" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                  {/* Tier 2 slab */}
                  <rect x="46" y="50" width="108" height="100" fill="#475569" />
                  {/* Tier 3 slab */}
                  <rect x="66" y="33" width="68" height="134" fill="#475569" />
                  
                  {/* Highlight outlines */}
                  <rect x="46" y="50" width="108" height="100" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="66" y="33" width="68" height="134" fill="none" stroke="#94a3b8" strokeWidth="1" />
                </g>
              )}

              {coreShape === '4-stepped' && (
                <g>
                  {/* Center slab */}
                  <rect x="31" y="70" width="138" height="60" fill="#475569" />
                  {/* Tier 2 */}
                  <rect x="41" y="56" width="118" height="88" fill="#475569" />
                  {/* Tier 3 */}
                  <rect x="56" y="41" width="88" height="118" fill="#475569" />
                  {/* Tier 4 */}
                  <rect x="70" y="31" width="60" height="138" fill="#475569" />
                  
                  {/* Overlays */}
                  <rect x="31" y="70" width="138" height="60" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="41" y="56" width="118" height="88" fill="none" stroke="#a1a1aa" strokeWidth="1" />
                  <rect x="56" y="41" width="88" height="118" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="70" y="31" width="60" height="138" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                </g>
              )}

              {coreShape === 'rectangular' && (
                <rect x="45" y="65" width="110" height="70" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              )}

              {/* Diagonal Line indicating Circumscribing Circle Diameter */}
              <line x1="47" y1="47" x2="153" y2="153" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="47" cy="47" r="3" fill="#f59e0b" />
              <circle cx="153" cy="153" r="3" fill="#f59e0b" />
              
              {/* Core center point */}
              <circle cx="100" cy="100" r="2.5" fill="#ef4444" />
            </svg>

            {/* Display labels */}
            <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-amber-400 flex flex-col items-end">
              <span>Winding Coil ID = {circDiameterMm} mm</span>
              <span>Leg Thickness = {coreWidthAMm} mm</span>
              <span>Core Depth = {coreDepthBMm} mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER DIAGRAM LEGEND */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500 block border border-amber-600"></span>
          <span className="text-slate-300">HV / Primary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-indigo-500 block border border-indigo-600"></span>
          <span className="text-slate-300">LV / Secondary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-slate-600 block border border-slate-400"></span>
          <span className="text-slate-300">Silicon Steel Core</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-t border-dashed border-cyan-400 block"></span>
          <span className="text-slate-300">Magnetic Path</span>
        </div>
      </div>
    </div>
  );
};
