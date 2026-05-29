/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AWG_TABLE, SWG_TABLE, METRIC_TABLE, findNearestWireGauge } from '../utils/constants';
import { Search, ShieldAlert, Cpu } from 'lucide-react';

export const WireGaugeTable: React.FC = () => {
  const [selectedStandard, setSelectedStandard] = useState<'awg' | 'swg' | 'metric'>('awg');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [targetCurrent, setTargetCurrent] = useState<string>('3.5');
  const [targetDensity, setTargetDensity] = useState<number>(2.5); // A/mm2

  // Current sizer
  const currentNum = parseFloat(targetCurrent) || 0.0;
  const computedAreaMm2 = currentNum / targetDensity;
  const bestGauge = findNearestWireGauge(computedAreaMm2, selectedStandard);

  const activeTable = selectedStandard === 'metric' ? METRIC_TABLE : (selectedStandard === 'swg' ? SWG_TABLE : AWG_TABLE);

  // Filtered array
  const filteredGauges = activeTable.filter((g) => {
    if (searchTerm === '') return true;
    return (
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.diameterMm.toString().includes(searchTerm)
    );
  });

  return (
    <div id="wire-gauge-panel" className="bg-[#1a1d23] border border-slate-800 rounded p-4 text-white flex flex-col gap-4 shadow-xl">
      <div className="border-b border-slate-800 pb-2.5 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <Cpu className="text-amber-500 w-4 h-4" />
            Standard Wire Gauge &amp; Ampacity Calculator
          </h3>
          <p className="text-[10px] text-slate-400">
            Compare industrial copper sizes across multiple measurement systems and find safety compliant wire diameters
          </p>
        </div>
      </div>

      {/* STANDARD SELECTOR TABS */}
      <div className="flex bg-slate-950 border border-slate-800/80 rounded p-1 gap-1 w-full max-w-md">
        <button
          type="button"
          onClick={() => { setSelectedStandard('awg'); setSearchTerm(''); }}
          className={`flex-1 py-1 px-3 text-xs rounded transition-all font-bold uppercase font-mono cursor-pointer ${
            selectedStandard === 'awg'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          AWG (American)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedStandard('swg'); setSearchTerm(''); }}
          className={`flex-1 py-1 px-3 text-xs rounded transition-all font-bold uppercase font-mono cursor-pointer ${
            selectedStandard === 'swg'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          SWG (British)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedStandard('metric'); setSearchTerm(''); }}
          className={`flex-1 py-1 px-3 text-xs rounded transition-all font-bold uppercase font-mono cursor-pointer ${
            selectedStandard === 'metric'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Metric (mm²)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WIRING SIZER COMPUTATION BOX */}
        <div className="bg-slate-950 p-4 rounded border border-slate-800 flex flex-col gap-4 self-start">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">Current to Winding Gauge Sizer</span>
          
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Continuous Load Current (A)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={targetCurrent}
                onChange={(e) => setTargetCurrent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-sm text-slate-200 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Target Current Density (A/mm²)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1.0"
                  max="6.0"
                  step="0.1"
                  value={targetDensity}
                  onChange={(e) => setTargetDensity(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500 bg-slate-850 h-1 rounded"
                />
                <span className="text-xs font-mono font-bold w-12 text-right">{targetDensity} A/mm²</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1">
                Ref: Natural cooling = 1.5–2.3, Forced = 2.2–4.0, Water cooling = 5.0–6.0 (Page 34)
              </p>
            </div>
          </div>

          {currentNum > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col gap-2 mt-2 animate-fade-in">
              <span className="text-[10px] uppercase text-slate-500 tracking-wide font-mono">Synthesizer recommendation</span>
              <div className="flex justify-between items-center bg-amber-500/10 p-2 rounded border border-amber-500/20">
                <span className="text-xs text-slate-300 font-mono">Required Area</span>
                <span className="text-sm font-bold font-mono text-amber-500">{computedAreaMm2.toFixed(4)} mm²</span>
              </div>

              <div className="bg-slate-950 p-2 rounded flex flex-col gap-1 border border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Best Wire Code</span>
                  <span className="font-bold text-amber-500 font-mono">{bestGauge.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Actual Area</span>
                  <span className="font-semibold text-slate-200 font-mono">{bestGauge.areaMm2} mm²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Outer Diameter</span>
                  <span className="font-semibold text-slate-200 font-mono">{bestGauge.diameterMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resistance</span>
                  <span className="font-semibold text-sky-400 font-mono">{bestGauge.resistanceOhmPerMeter} Ω/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weight/100m</span>
                  <span className="font-semibold text-slate-200 font-mono">{(bestGauge.weightKgPerKm * 0.1).toFixed(3)} kg</span>
                </div>
              </div>

              {((bestGauge.standard === 'awg' && bestGauge.awg > 34) || (bestGauge.standard === 'swg' && bestGauge.awg > 34)) && (
                <div className="flex gap-1.5 text-[9px] text-amber-500 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 leading-relaxed mt-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Caution: {bestGauge.name} is extremely thin. High danger of mechanical breakage during hand-winding operations. Use parallel bifilar wires if possible.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INTERACTIVE TABLE GRID */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 items-center">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder={`Filter by name or diameter...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono placeholder:text-slate-600"
            />
          </div>

          <div className="overflow-y-auto max-h-[350px] border border-slate-800 rounded-lg custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 font-mono text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-2 border-r border-slate-850">Wire Gauge</th>
                  <th className="p-2 border-r border-slate-850">Diameter (mm)</th>
                  <th className="p-2 border-r border-slate-850">Area (mm²)</th>
                  <th className="p-2 border-r border-slate-850">Resistance (Ω/m)</th>
                  <th className="p-2 border-r border-slate-850">Weight (g/m)</th>
                  <th className="p-2">Max. Amp at 3A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {filteredGauges.map((wire) => {
                  const isSizedBest = bestGauge.name === wire.name && currentNum > 0;
                  return (
                    <tr
                      key={wire.name}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSizedBest ? 'bg-indigo-950/40 font-semibold text-indigo-300' : 'text-slate-350'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-850 font-bold">
                        {isSizedBest && '★ '} {wire.name}
                      </td>
                      <td className="p-2 border-r border-slate-850">{wire.diameterMm}</td>
                      <td className="p-2 border-r border-slate-850">{wire.areaMm2}</td>
                      <td className="p-2 border-r border-slate-850 text-indigo-400">{wire.resistanceOhmPerMeter}</td>
                      <td className="p-2 border-r border-slate-850">{wire.weightKgPerKm.toFixed(2)}</td>
                      <td className="p-2 font-bold text-slate-200">{wire.maxCurrentAt3A} A</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
