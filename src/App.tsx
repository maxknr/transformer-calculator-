/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CoreStyle, CoreShape, MaterialType, CoolingType, TransformerDesignInput, TransformerDesignResult } from './types';
import { calculateTransformerDesign } from './utils/calculations';
import { MATERIALS } from './utils/constants';
import { CoreVisualizer } from './components/CoreVisualizer';
import { WindingSimulator } from './components/WindingSimulator';
import { WireGaugeTable } from './components/WireGaugeTable';
import { TechnicalReport } from './components/TechnicalReport';
import { 
  Cpu, 
  Settings, 
  Download, 
  Printer, 
  RotateCcw, 
  Activity, 
  Layers, 
  Info, 
  Flame, 
  Check, 
  BadgeAlert,
  Sliders,
  Sparkles
} from 'lucide-react';

const INITIAL_INPUTS: TransformerDesignInput = {
  coreStyle: '1p-core',
  coreShape: 'cruciform',
  materialType: 'crgo',
  customKi: 0.9,
  customFluxDensity: 1.2,
  customDensity: 7650,
  customBaseLoss: 1.5,
  powerVa: 250,
  frequency: 50,
  vPrimary: 230,
  vSecondary: 12,
  centerTappedSecondary: false,
  coolingType: 'AN',
  currentDensityLimit: 2.2, // A/mm^2
  windowSpaceFactorKw: 0.35,
  useAutomaticDimensions: true,
  dCircumscribing: 45,
  rectCoreWidth: 30,
  rectCoreDepth: 45,
  windowHeight: 80,
  windowWidth: 35
};

export default function App() {
  const [inputs, setInputs] = useState<TransformerDesignInput>(INITIAL_INPUTS);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'simulator' | 'gauge' | 'saturation' | 'report'>('blueprint');
  const [designResult, setDesignResult] = useState<TransformerDesignResult | null>(null);

  // Re-run calculations on input mutations
  useEffect(() => {
    const result = calculateTransformerDesign(inputs);
    setDesignResult(result);
  }, [inputs]);

  const handleInputChange = (key: keyof TransformerDesignInput, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Quick Power Preset tags to aid ease of testing
  const applyPreset = (va: number) => {
    let currentDensity = 2.2;
    let autoDims = true;
    let vPri = 230;
    let vSec = 12;

    if (va >= 10000) {
      currentDensity = 3.2; // distribution transformers are forced-ventilated
      vPri = 11000;         // 11kV step down
      vSec = 400;           // 400V standard 3phase
    } else if (va >= 1000) {
      currentDensity = 2.5;
      vPri = 440;
      vSec = 110;
    }

    setInputs((prev) => ({
      ...prev,
      powerVa: va,
      currentDensityLimit: currentDensity,
      vPrimary: vPri,
      vSecondary: vSec,
      useAutomaticDimensions: autoDims
    }));
  };

  const handleCSVExport = () => {
    if (!designResult) return;
    
    const data = [
      ["Parameter", "Calculated Value", "Unit", "Equation Reference / Description"],
      ["Software Suite", "Ampin Transformer Designer Pro", "", "Swiss-Precision Power Transformers Core Engine"],
      ["Construction Style", designResult.inputs.coreStyle.toUpperCase(), "", "Page 2 Core Orientation Type"],
      ["Core Shell Shape", designResult.inputs.coreShape.toUpperCase(), "", "Stepped profile factor (Kc)"],
      ["Active Core Alloy", designResult.activeMaterial.name, "", "Material magnetic permeability grade"],
      ["Apparent Net Power", designResult.inputs.powerVa, "VA", "S rating"],
      ["Line Frequency", designResult.inputs.frequency, "Hz", "f (Hz) sinusoidal excitation"],
      ["Primary Voltage", designResult.inputs.vPrimary, "V", "Input Phase voltage"],
      ["Secondary Voltage", inputs.centerTappedSecondary ? `${inputs.vSecondary}V - 0 - ${inputs.vSecondary}V` : designResult.inputs.vSecondary, "V", "Secondary output voltage target"],
      ["Operating Flux Density (Bm)", designResult.operatingBm, "Tesla", "Page 33 saturation thresholds"],
      ["Emp Induced per Turn (Et)", designResult.emfPerTurnEt.toFixed(5), "V/turn", "Page 15: Et = 4.44 * f * PhiM"],
      ["Primary Coil turns (Tp)", designResult.turnsPrimaryTp, "turns", "Page 57: Tp = Vp / Et"],
      ["Secondary Coil turns (Ts)", inputs.centerTappedSecondary ? `${designResult.turnsSecondaryTs} turns (2x ${designResult.turnsSecondaryTs / 2})` : `${designResult.turnsSecondaryTs} turns`, "turns", inputs.centerTappedSecondary ? "Center-tapped symmetric split winding" : "Page 57: Ts = Vs / Et"],
      ["Theoretical turns multiplier", designResult.expectedTurnsRatio.toFixed(4), "", "Nominal electrical ratio Vp/Vs"],
      ["Actual turns multiplier", designResult.actualTurnsRatio.toFixed(4), "", "Physical wire integer ratio Tp/Ts"],
      ["Actual Output Volt (Vsec)", inputs.centerTappedSecondary ? `${(designResult.actualVSecondary / 2.0).toFixed(2)}V - 0 - ${(designResult.actualVSecondary / 2.0).toFixed(2)}V` : designResult.actualVSecondary.toFixed(2), "V", "True coupling secondary voltage output"],
      ["Secondary voltage error", designResult.turnsRatioError.toFixed(3), "%", "Tolerance boundary"],
      ["Primary Line current (Ip)", designResult.currentPrimaryIp.toFixed(4), "A", "Page 57: Ip = S / Vp"],
      ["Secondary Line current (Is)", designResult.currentSecondaryIs.toFixed(4), "A", "Page 57: Is = S / Vs"],
      ["Required Primary gauge area", designResult.conductorAreaPrimaryAp.toFixed(4), "mm2", "Ip / Delta"],
      ["Required Secondary gauge area", designResult.conductorAreaSecondaryAs.toFixed(4), "mm2", "Is / Delta"],
      ["Selected Primary Gauge", designResult.wirePrimary.name, "", "Diameter of winding wire"],
      ["Selected Secondary Gauge", designResult.wireSecondary.name, "", "Diameter of secondary conductor wire"],
      ["Net Silicon Steel weight", designResult.ironWeightKg.toFixed(3), "kg", "Mass of legs & yokes combined"],
      ["Net Copper Windings weight", designResult.totalCopperWeightKg.toFixed(3), "kg", "Combined weight of winding material"],
      ["Iron active loss (Pi)", designResult.ironLossWatts.toFixed(2), "W", "Hysteresis + Eddy Current losses"],
      ["Copper load loss (Pcu)", designResult.totalCopperLossWatts.toFixed(2), "W", "Winding resistance heat dissipation"],
      ["Estimated Net Efficiency", designResult.estimatedEfficiency.toFixed(3), "%", "P_out / (P_out + Losses)"],
      ["Uncooled Plain tank heating", designResult.tempRisePlainCc.toFixed(1), "C", "Page 69 plain-wall convection rise"],
      ["Cooling Tube system status", designResult.coolingTubesRequired ? "REQUIRED" : "NOT REQUIRED", "", "Is plain surface safe?"],
      ["Number of cooling tubes", designResult.coolingTubesCount, "tubes", "50mm cooling tubes needed"]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ampin_transformer_pro_design_${inputs.powerVa}va.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  const handleResetToDefaults = () => {
    setInputs(INITIAL_INPUTS);
  };

  // Calculations safety check
  if (!designResult) return null;

  const isSaturated = designResult.operatingBm > designResult.activeMaterial.maxFluxDensity;
  const isKneeHigh = designResult.operatingBm >= designResult.activeMaterial.recommendedFluxDensity * 1.05;

  return (
    <div className="min-h-screen bg-[#0f1115] font-sans text-slate-300 selection:bg-amber-500 selection:text-black flex flex-col pb-6 print:bg-white print:text-black">
      {/* PROFESSIONAL SWISS HEADER */}
      <header className="h-14 bg-[#1a1d23] border-b border-slate-700 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-black fill-current"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider uppercase">Ampin Transformer Designer</h1>
            <p className="text-[10px] text-amber-500 font-mono">PRO EDITION v4.2.0</p>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handleCSVExport}
            className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs hover:bg-slate-700 text-white flex items-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            EXPORT CSV
          </button>
          
          <button
            onClick={handlePrintTrigger}
            className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-500 flex items-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            GENERATE TECH REPORT (PDF)
          </button>

          <button
            onClick={handleResetToDefaults}
            className="p-1.5 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center justify-center cursor-pointer"
            title="Reset to Initial Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE GRID */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 print:block flex-1 w-full">
        
        {/* INPUT COLLAPSE SETTINGS PANEL (4 cols) */}
        <section id="inputs-navigation-sidebar" className="lg:col-span-4 flex flex-col gap-4 print:hidden">
          <div className="bg-[#1a1d23] border border-slate-800 rounded p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Settings className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Design Input Matrices
              </h2>
            </div>

            {/* Quick Ratings selector preset helper */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-mono font-bold block mb-1">
                Quick Ratings Presets
              </label>
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded border border-slate-800">
                <button onClick={() => applyPreset(50)} className="text-[10px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 transition-colors cursor-pointer">50 VA</button>
                <button onClick={() => applyPreset(250)} className="text-[10px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 transition-colors cursor-pointer">250 VA</button>
                <button onClick={() => applyPreset(1000)} className="text-[10px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 transition-colors cursor-pointer">1 kVA</button>
                <button onClick={() => applyPreset(10000)} className="text-[10px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 transition-colors cursor-pointer">10 kVA</button>
              </div>
            </div>

            {/* MATRIX 1: ELECTRIC DEMANDS */}
            <div className="flex flex-col gap-3 p-3 bg-slate-950 rounded border border-slate-850">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-amber-500"></span> Primary Parameters
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">POWER CAPACITY S (VA)</span>
                  <input
                    type="number"
                    min="1"
                    max="5000000"
                    value={inputs.powerVa}
                    onChange={(e) => handleInputChange('powerVa', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">FREQUENCY f (HZ)</span>
                  <select
                    value={inputs.frequency}
                    onChange={(e) => handleInputChange('frequency', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-500 font-mono"
                  >
                    <option value={50}>50 Hz (Eur/Ind)</option>
                    <option value={60}>60 Hz (USA/Jpn)</option>
                    <option value={400}>400 Hz (Aviation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">PRIMARY VOLTAGE (V)</span>
                  <input
                    type="number"
                    min="1"
                    value={inputs.vPrimary}
                    onChange={(e) => handleInputChange('vPrimary', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">SECONDARY VOLTAGE (V)</span>
                  <input
                    type="number"
                    min="1"
                    value={inputs.vSecondary}
                    onChange={(e) => handleInputChange('vSecondary', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* CENTER TAPPED TOGGLE SWITCH */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-850 mt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-300 font-mono">SECONDARY CENTER-TAPPED</span>
                  <span className="text-[8.5px] text-slate-500 leading-tight">Symmetric split winding (V_sec per side)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('centerTappedSecondary', !inputs.centerTappedSecondary)}
                  className={`w-14 h-6 px-1 rounded-full transition-colors relative cursor-pointer outline-none ${
                    inputs.centerTappedSecondary ? 'bg-amber-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                      inputs.centerTappedSecondary ? 'translate-x-8' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* MATRIX 2: STEEL ALLOY PROPERTIES */}
            <div className="flex flex-col gap-3 p-3 bg-slate-950 rounded border border-slate-850">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-blue-500"></span> Core Material Specs
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono mb-1">Material Composition</span>
                <select
                  value={inputs.materialType}
                  onChange={(e) => handleInputChange('materialType', e.target.value as MaterialType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white uppercase font-mono"
                >
                  <option value="crgo">Silicon Steel CRGO (M-4)</option>
                  <option value="hrgo">Silicon Steel (HRGO)</option>
                  <option value="normal-si">Silicon Steel (Non-Oriented)</option>
                  <option value="custom">Custom Alloy</option>
                </select>
                <span className="text-[10px] text-slate-500 italic mt-1.5 leading-relaxed uppercase font-medium">
                  {MATERIALS[inputs.materialType]?.description || 'Custom alloy specific profile parameters'}
                </span>
              </div>

              {inputs.materialType === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-1.5 bg-slate-900 border border-slate-800 p-2.5 rounded">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-450 font-mono">Max Flux (Bₘₐₓ)</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="number"
                        step="0.05"
                        min="0.4"
                        max="2.1"
                        value={inputs.customFluxDensity}
                        onChange={(e) => handleInputChange('customFluxDensity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-amber-400 font-bold"
                      />
                      <span className="text-[10px] font-mono text-slate-400">T</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-450 font-mono">Stacking Factor (Kᵢ)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.75"
                      max="0.99"
                      value={inputs.customKi}
                      onChange={(e) => handleInputChange('customKi', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MATRIX 3: ASSEMBLY & GEOMETRY LIMITS */}
            <div className="flex flex-col gap-3 p-3 bg-slate-950 rounded border border-slate-850">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500"></span> Frame &amp; Cooling Layout
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">CORE STYLE</span>
                  <select
                    value={inputs.coreStyle}
                    onChange={(e) => handleInputChange('coreStyle', e.target.value as CoreStyle)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                  >
                    <option value="1p-core">1-Phase Core</option>
                    <option value="1p-shell">1-Phase Shell</option>
                    <option value="3p-core">3-Phase Core</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-mono">CORE PROFILE</span>
                  <select
                    value={inputs.coreShape}
                    onChange={(e) => handleInputChange('coreShape', e.target.value as CoreShape)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none font-mono"
                  >
                    <option value="cruciform">Cruciform (Stepped)</option>
                    <option value="square">Square Core</option>
                    <option value="3-stepped">3-Stepped</option>
                    <option value="4-stepped">4-Stepped</option>
                    <option value="rectangular">Rectangular Core</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1 py-1 px-2.5 bg-slate-900/60 rounded border border-slate-800">
                <input
                  type="checkbox"
                  id="auto-dim-toggle"
                  checked={inputs.useAutomaticDimensions}
                  onChange={(e) => handleInputChange('useAutomaticDimensions', e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer w-3.5 h-3.5"
                />
                <label htmlFor="auto-dim-toggle" className="text-xs text-slate-300 font-medium cursor-pointer select-none">
                  Auto-Compile Core Dimensions
                </label>
              </div>

              {!inputs.useAutomaticDimensions && (
                <div className="flex flex-col gap-3 mt-1.5 bg-slate-900 border border-slate-800 p-2.5 rounded animate-fade-in">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">CIRC CIRCLE DIA (d) (mm)</span>
                    <input
                      type="number"
                      min="10"
                      value={inputs.dCircumscribing}
                      onChange={(e) => handleInputChange('dCircumscribing', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white outline-none"
                    />
                  </div>

                  {inputs.coreShape === 'rectangular' && (
                    <div className="grid grid-cols-2 gap-2">
                       <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono">WIDTH a (mm)</span>
                        <input
                          type="number"
                          value={inputs.rectCoreWidth}
                          onChange={(e) => handleInputChange('rectCoreWidth', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white outline-none"
                        />
                       </div>
                       <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-mono">DEPTH b (mm)</span>
                        <input
                          type="number"
                          value={inputs.rectCoreDepth}
                          onChange={(e) => handleInputChange('rectCoreDepth', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white outline-none"
                        />
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">WINDOW H_w (mm)</span>
                      <input
                        type="number"
                        min="20"
                        value={inputs.windowHeight}
                        onChange={(e) => handleInputChange('windowHeight', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">WINDOW W_w (mm)</span>
                      <input
                        type="number"
                        min="10"
                        value={inputs.windowWidth}
                        onChange={(e) => handleInputChange('windowWidth', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono">CURRENT DENSITY LIMIT (A/mm²)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={inputs.currentDensityLimit}
                      onChange={(e) => handleInputChange('currentDensityLimit', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 mt-1 text-sm font-mono text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono mb-1">TANK VENTILATION COOLING</span>
                <select
                  value={inputs.coolingType}
                  onChange={(e) => handleInputChange('coolingType', e.target.value as CoolingType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white uppercase font-mono"
                >
                  <option value="AN">AN (Air Natural convection)</option>
                  <option value="ON">ON (Liquid Mineral Oil Natural)</option>
                  <option value="OFN">OFN (Forced Oil - Natural air)</option>
                  <option value="AB">AB (Dry-type Forced Air Blast)</option>
                  <option value="OB">OB (Oil Air Forced blowers)</option>
                  <option value="OFB">OFB (Accelerated Oil Air Blast)</option>
                  <option value="OW">OW (Circulating Water radiator)</option>
                  <option value="OFW">OFW (Forced water heat exchanger)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-mono mb-1">CONDUCTOR WIRE STANDARD</span>
                <div className="flex bg-slate-900 border border-slate-700 rounded p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => handleInputChange('wireStandard', 'awg')}
                    className={`flex-1 py-1 text-[10px] rounded transition-all font-bold uppercase font-mono cursor-pointer ${
                      (inputs.wireStandard || 'awg') === 'awg'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AWG (US)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('wireStandard', 'swg')}
                    className={`flex-1 py-1 text-[10px] rounded transition-all font-bold uppercase font-mono cursor-pointer ${
                      inputs.wireStandard === 'swg'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SWG (UK)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('wireStandard', 'metric')}
                    className={`flex-1 py-1 text-[10px] rounded transition-all font-bold uppercase font-mono cursor-pointer ${
                      inputs.wireStandard === 'metric'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    mm² (Metric)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKSPACE DETAILED OUTPUT MATRICES (8 cols) */}
        <section id="outputs-tabs-workspace" className="lg:col-span-8 flex flex-col gap-4 print:w-full print:block">
          
          {/* Tabs header selector */}
          <div className="flex bg-[#1a1d23] p-1.5 rounded border border-slate-800 justify-between gap-1 select-none overflow-x-auto print:hidden">
            <button
              onClick={() => setActiveTab('blueprint')}
              className={`flex-1 min-w-[90px] py-2 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                activeTab === 'blueprint'
                  ? 'bg-slate-800 text-amber-500 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Blueprint Frame
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 min-w-[90px] py-2 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-slate-800 text-amber-500 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Winding simulator
            </button>
            <button
              onClick={() => setActiveTab('gauge')}
              className={`flex-1 min-w-[90px] py-2 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                activeTab === 'gauge'
                  ? 'bg-slate-800 text-amber-500 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Wire Gauge directory
            </button>
            <button
              onClick={() => setActiveTab('saturation')}
              className={`flex-1 min-w-[90px] py-2 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                activeTab === 'saturation'
                  ? 'bg-slate-800 text-amber-500 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              B-H Saturation curve
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 min-w-[90px] py-2 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-slate-800 text-amber-500 border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Full Dossier
            </button>
          </div>

          {/* ACTIVE TAB SECTIONS DISPLAY */}
          <div className="print:block flex flex-col gap-6">
            
            {/* ALERT WARNING OVERLAYS FOR LOW TURNS OR SATURATED FLUX */}
            {(isSaturated || isKneeHigh) && (
              <div className="flex gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs leading-normal animate-pulse text-rose-400 print:hidden">
                <BadgeAlert className="w-5 h-5 shrink-0 self-start text-rose-500" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold uppercase tracking-wide">
                    {isSaturated ? 'Core saturation threat detected!' : 'Approaching Core saturation Knee'}
                  </span>
                  <span>
                    Your operating flux density of <strong>{designResult.operatingBm} Tesla</strong>{' '}
                    {isSaturated ? `exceeds the physical saturation threshold limit of your material steel (${designResult.activeMaterial.maxFluxDensity} T).` : 'is close to core knee limits.'}{' '}
                    In a real transformer build, this will induce heavy hysteresis core losses ({designResult.ironLossWatts.toFixed(0)} W), massive magnetizing leakage currents, and extreme heating of plain tank walls. Increase core circle diameter or use premium CRGO oriented laminations.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 1: BLUEPRINT FRAME */}
            {activeTab === 'blueprint' && (
              <div className="flex flex-col gap-6 print:hidden">
                {/* 2D Vector draw blueprint */}
                <CoreVisualizer design={designResult} />

                {/* Analytical summary card details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left block mechanical */}
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl text-xs flex flex-col gap-3">
                    <span className="font-semibold text-slate-300 font-mono uppercase tracking-wider border-b border-slate-800 pb-1.5">
                      Mechanical Core Synthesis Parameters
                    </span>
                    <div className="flex flex-col gap-2 text-slate-400">
                      <div className="flex justify-between font-mono">
                        <span>Circ Circle diameter:</span>
                        <span className="text-white font-bold">{designResult.circDiameterMm} mm</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Lamination stack factor (Ki):</span>
                        <span className="text-white font-bold">{designResult.stackingFactorKi}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Gross Core area (Agi):</span>
                        <span className="text-white font-bold">{(designResult.grossCoreAreaAgi * 1e4).toFixed(3)} cm²</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Net Iron area (Ai):</span>
                        <span className="text-white font-bold">{(designResult.netIronAreaAi * 1e4).toFixed(2)} cm²</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Peak Magnetic Core Flux (Φm):</span>
                        <span className="text-white font-bold">{(designResult.fluxValuePhiM * 1000).toFixed(2)} milliWebers</span>
                      </div>
                      <div className="flex justify-between font-mono pt-1 border-t border-slate-800">
                        <span>Total Assembly mass:</span>
                        <span className="text-emerald-400 font-bold">{designResult.totalWeightKg.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block electrical */}
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl text-xs flex flex-col gap-3">
                    <span className="font-semibold text-slate-300 font-mono uppercase tracking-wider border-b border-slate-800 pb-1.5">
                      Electrical Transformer Windings
                    </span>
                    <div className="flex flex-col gap-2 text-slate-400">
                      <div className="flex justify-between font-mono">
                        <span>Voltage induction per turn:</span>
                        <span className="text-white font-bold">{designResult.emfPerTurnEt.toFixed(4)} V/turn</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Primary turns (Tp):</span>
                        <span className="text-white font-bold">{designResult.turnsPrimaryTp} turns</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Secondary turns (Ts):</span>
                        <span className="text-white font-bold">
                          {inputs.centerTappedSecondary 
                            ? `${designResult.turnsSecondaryTs} (2x ${designResult.turnsSecondaryTs / 2} CT)`
                            : `${designResult.turnsSecondaryTs} turns`}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Calculated efficiency:</span>
                        <span className="text-indigo-400 font-bold">{designResult.estimatedEfficiency.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Winding insulation kw factor:</span>
                        <span className="text-white font-bold">{(designResult.inputs.windowSpaceFactorKw * 100).toFixed(0)}% space use</span>
                      </div>
                      <div className="flex justify-between font-mono pt-1 border-t border-slate-800">
                        <span>Copper loss at full rating:</span>
                        <span className="text-amber-500 font-bold">{designResult.totalCopperLossWatts.toFixed(1)} Watts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WINDING SIMULATOR */}
            {activeTab === 'simulator' && (
              <div className="print:hidden">
                <WindingSimulator design={designResult} />
              </div>
            )}

            {/* TAB 3: WIRE GAUGE LOOKUP */}
            {activeTab === 'gauge' && (
              <div className="print:hidden">
                <WireGaugeTable />
              </div>
            )}

            {/* TAB 4: SATURATION CURVE */}
            {activeTab === 'saturation' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col gap-6 shadow-xl print:hidden">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-slate-200 flex items-center gap-1.5">
                    <Activity className="text-rose-400 w-4 h-4" />
                    B-H Saturation path Hysteresis Curve
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing operating flux density ({designResult.operatingBm} T) vs. core steel saturation limits
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* SVG Plot graph of B-H curve */}
                  <div className="md:col-span-2 aspect-[4/3] bg-slate-950 rounded-xl border border-slate-850 p-4 relative flex items-center justify-center">
                    <svg className="w-full h-full text-slate-500" viewBox="0 0 240 180">
                      {/* Grid helper lines */}
                      <line x1="30" y1="10" x2="30" y2="150" stroke="#1e293b" />
                      <line x1="30" y1="150" x2="230" y2="150" stroke="#1e293b" />
                      
                      <line x1="30" y1="80" x2="230" y2="80" stroke="#0f172a" strokeDasharray="2,2" />
                      <line x1="130" y1="10" x2="130" y2="150" stroke="#0f172a" strokeDasharray="2,2" />

                      {/* Path curves for Non-oriented vs HRGO vs CRGO */}
                      {/* CRGO Curve - knee height 1.6 T */}
                      <path
                        d="M 30,150 Q 80,45 230,28"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        opacity={inputs.materialType === 'crgo' ? 1.0 : 0.3}
                      />
                      {/* HRGO Curve - knee height 1.3 T */}
                      <path
                        d="M 30,150 Q 90,65 230,48"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        opacity={inputs.materialType === 'hrgo' ? 1.0 : 0.3}
                      />
                      {/* Regular Silicon Steel - knee height 1.0 T */}
                      <path
                        d="M 30,150 Q 100,85 230,70"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        opacity={inputs.materialType === 'normal-si' ? 1.0 : 0.3}
                      />

                      {/* Active Operating point pulse on active graph */}
                      {(() => {
                        // Let's compute coordinate coordinates of active design operate point
                        // Map 0 to 2.0 Tesla on B axis (y value 150 to 10)
                        const bm = designResult.operatingBm;
                        const ptY = 150 - (bm / 2.1) * 140;
                        
                        // Map typical corresponding magnetic field intensity H on X axis
                        const ptX = 30 + Math.atan((bm / 1.7) * 2.0) * 125;

                        return (
                          <g>
                            {/* Line limits indicators */}
                            <line x1="30" y1={ptY} x2={ptX} y2={ptY} stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="3,3" />
                            <line x1={ptX} y1="150" x2={ptX} y2={ptY} stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="3,3" />

                            <circle
                              cx={ptX}
                              cy={ptY}
                              r={isSaturated ? "5" : "4"}
                              fill="#f43f5e"
                              className={isSaturated ? "animate-ping" : ""}
                            />
                            <circle cx={ptX} cy={ptY} r="3" fill="#ef4444" />
                            
                            <text x={ptX + 6} y={ptY - 4} fill="#f43f5e" className="text-[9px] font-bold font-mono">
                              OP ({bm.toFixed(2)} T)
                            </text>
                          </g>
                        );
                      })()}

                      {/* Axis indicators */}
                      <text x="5" y="15" className="text-[9px] font-mono fill-slate-400">B (T)</text>
                      <text x="215" y="165" className="text-[9px] font-mono fill-slate-400">H (A/m)</text>
                      
                      <text x="15" y="75" className="text-[8px] font-mono fill-slate-500">1.0T</text>
                      <text x="15" y="45" className="text-[8px] font-mono fill-slate-500">1.5T</text>
                    </svg>

                    <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] font-mono text-slate-400 flex flex-col gap-1 border border-slate-850">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        CRGO Curve Limit: ~1.7 T
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        HRGO Curve Limit: ~1.4 T
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Silicon steel Limit: ~1.1 T
                      </span>
                    </div>
                  </div>

                  {/* Description breakdown logic text */}
                  <div className="flex flex-col gap-3 font-sans text-xs text-slate-350">
                    <span className="uppercase text-[10px] font-bold text-slate-500 tracking-wider">MAGNETIC BEHAVIOR REPORT</span>
                    <h4 className="text-white font-bold leading-tight">
                      How Flux Density Constrains Turns ratios
                    </h4>
                    
                    <p className="leading-relaxed">
                      Every transformer relies on holding core magnetic fields below material limits. Ramping continuous currents without core circumference scaling results in <b>magnetic saturation</b>. 
                    </p>
                    <p className="leading-relaxed">
                      Your chosen flux density parameter of <b>{designResult.operatingBm} Tesla</b> dictates the EMF per turn potential. Standard Silicon laminations saturate at 1.1T, oriented steels up to 1.7T.
                    </p>
                    <p className="leading-relaxed font-mono text-[10.5px] text-amber-500 flex items-start gap-1 p-2 bg-slate-950 border border-slate-850 rounded">
                      <Info className="w-4 h-4 shrink-0" />
                      Rule: Higher Bm indices yield higher EMF/turn, reducing the physical copper wraps and resistance losses but increasing hysteresis core loss.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: PRINT COMPLIANT DOSSIER PREVIEW */}
            {activeTab === 'report' && (
              <div className="print:hidden">
                <TechnicalReport design={designResult} />
              </div>
            )}

            {/* FULL COMPLIANT PRINT ONLY REPORT OVERLAY PANEL */}
            <div className="hidden print:block text-black bg-white w-full">
              <TechnicalReport design={designResult} />
            </div>

          </div>
        </section>

      </main>

      {/* Dynamic Info Rail Footer matching High Density theme */}
      <footer className="h-8 bg-[#12141a] border-t border-slate-800 flex items-center px-6 gap-8 shrink-0 mt-auto select-none print:hidden">
        <div className="flex gap-4 items-center">
          <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1.5 leading-none">
            <span className={`w-2 h-2 rounded-full inline-block ${isSaturated ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
            ENGINE STATUS: <span className={isSaturated ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{isSaturated ? 'CRITICAL SATURATION' : 'NOMINAL CALIBRATED'}</span>
          </div>
          <div className="text-[9px] text-slate-500 uppercase border-l border-slate-800 pl-4 leading-none">
            TEMP RISE EST: <span className="text-slate-200 font-mono font-bold">{designResult.tempRisePlainCc.toFixed(1)} °C</span>
          </div>
          <div className="text-[9px] text-slate-500 uppercase border-l border-slate-800 pl-4 leading-none font-mono">
            CORE LOSS: <span className="text-slate-200 font-bold">{(designResult.ironLossWatts).toFixed(2)} W</span>
          </div>
          <div className="text-[9px] text-slate-500 uppercase border-l border-slate-800 pl-4 leading-none font-mono">
            COPPER LOSS: <span className="text-slate-200 font-bold">{(designResult.totalCopperLossWatts).toFixed(2)} W</span>
          </div>
          <div className="text-[9px] text-slate-500 uppercase border-l border-slate-800 pl-4 leading-none font-mono">
            EFFICIENCY: <span className="text-amber-500 font-bold">{designResult.estimatedEfficiency.toFixed(2)}%</span>
          </div>
        </div>
        <div className="ml-auto text-[9px] text-slate-500 font-mono leading-none">
          CALCULATION MATRIX: [S={designResult.inputs.powerVa}VA • f={inputs.frequency}Hz • Bₘ={designResult.operatingBm.toFixed(2)}T]
        </div>
      </footer>
    </div>
  );
}
