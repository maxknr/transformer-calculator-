/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { TransformerDesignResult } from '../types';
import { Printer, Calendar, FileCheck, Map } from 'lucide-react';

interface TechnicalReportProps {
  design: TransformerDesignResult;
}

export const TechnicalReport: React.FC<TechnicalReportProps> = ({ design }) => {
  const {
    activeMaterial,
    operatingBm,
    emfPerTurnEt,
    turnsPrimaryTp,
    turnsSecondaryTs,
    actualTurnsRatio,
    actualVSecondary,
    turnsRatioError,
    currentPrimaryIp,
    currentSecondaryIs,
    conductorAreaPrimaryAp,
    conductorAreaSecondaryAs,
    wirePrimary,
    wireSecondary,
    circDiameterMm,
    coreWidthAMm,
    coreDepthBMm,
    yokeWidthDyMm,
    yokeHeightHyMm,
    windowWidthWwMm,
    windowHeightHwMm,
    yokeLengthWMm,
    overallHeightHMm,
    ironWeightKg,
    totalCopperWeightKg,
    totalWeightKg,
    ironLossWatts,
    totalCopperLossWatts,
    totalLossWatts,
    estimatedEfficiency,
    tempRisePlainCc,
    coolingTubesRequired,
    coolingTubesCount,
    inputs: { coreStyle, coreShape, powerVa, frequency, vPrimary, vSecondary, coolingType, centerTappedSecondary }
  } = design;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div id="technical-report-container" className="bg-[#1a1d23] border border-slate-800 rounded p-6 text-white flex flex-col gap-6 shadow-xl relative overflow-hidden print:bg-white print:text-black print:shadow-none print:border-none print:p-0">
      
      {/* HEADER WITH PRINT INITIATION BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4 print:hidden">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-2">
            <FileCheck className="text-emerald-400 w-4 h-4" />
            Engineering Design Report Datasheet
          </h3>
          <p className="text-xs text-slate-400">
            Generate and export fully compliant mechanical & electrical specs
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 justify-center py-2 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <Printer className="w-4 h-4" />
          Export to PDF / Print Report
        </button>
      </div>

      {/* PRINT-ONLY HEADER INFO */}
      <div className="hidden print:flex flex-col gap-1 border-b-2 border-slate-950 pb-4 text-slate-900 bg-white">
        <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-950">AMPIN TRANSFORMER DESIGNER PRO</h1>
        <div className="flex justify-between items-center text-xs text-slate-500 font-mono mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Date of Synthesis: {currentDate}
          </span>
          <span>REPORT ID: TR-{(powerVa * frequency).toString(36).toUpperCase()}</span>
        </div>
      </div>

      {/* DETAILED TECH REPORT CORE CONTAINER (Print-safe styled theme) */}
      <div className="flex flex-col gap-6 bg-slate-950/40 p-6 rounded-xl border border-slate-800/80 print:bg-white print:text-black print:border-none print:p-0">
        
        {/* Title Block */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase print:text-emerald-700">TECHNICAL SPECIFICATION SHEET</span>
          <h2 className="text-lg font-bold font-sans tracking-tight text-white print:text-slate-950">
            {powerVa} VA Custom Transformer System
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded print:hidden"></div>
        </div>

        {/* SECTION 1: ELECTRICAL CONSTRAINTS */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 print:text-slate-700 print:border-slate-300">
            1. Electrical Loading & Ratings
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-300 print:text-slate-850">
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Power Rating</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{powerVa} VA</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Frequency</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{frequency} Hz</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Primary Voltage</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{vPrimary} V RMS</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Secondary Voltage</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{vSecondary} V RMS</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: WINDING & COIL WIRE SPECIFICATIONS */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 print:text-slate-700 print:border-slate-300">
            2. Winding Specifications & Turns Ratios
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Winding card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 print:bg-slate-50 print:border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-amber-500 print:text-amber-700 uppercase font-mono">PRIMARY WINDING (INPUT SIDE)</span>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3 text-slate-300 print:text-slate-850">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Total Turn Count</span>
                  <span className="font-mono font-bold text-slate-100 print:text-black">{turnsPrimaryTp} turns</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Nominal Current</span>
                  <span className="font-mono font-bold text-slate-100 print:text-black">{currentPrimaryIp.toFixed(3)} A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Wire Code (Gauge)</span>
                  <span className="font-mono font-bold text-slate-100 print:text-black">{wirePrimary.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Wire Area & Diameter</span>
                  <span className="font-mono text-slate-100 print:text-black">{wirePrimary.areaMm2} mm² / Ø{wirePrimary.diameterMm}mm</span>
                </div>
              </div>
            </div>

            {/* Secondary Winding card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 print:bg-slate-50 print:border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-indigo-400 print:text-indigo-800 uppercase font-mono">
                {centerTappedSecondary ? 'SECONDARY WINDING (CENTER-TAPPED)' : 'SECONDARY WINDING (OUTPUT SIDE)'}
              </span>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3 text-slate-300 print:text-slate-850">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Total Turn Count</span>
                  <span className="font-mono font-bold text-slate-100 print:text-black">
                    {centerTappedSecondary ? `${turnsSecondaryTs} turns (2x ${turnsSecondaryTs / 2} turns CT)` : `${turnsSecondaryTs} turns`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Nominal Current</span>
                  <span className="font-mono font-bold text-slate-100 print:text-black">{currentSecondaryIs.toFixed(3)} A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Wire Code (Gauge)</span>
                  <span className="font-mono font-bold text-slate-100 print:text-black">{wireSecondary.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500">Wire Area & Diameter</span>
                  <span className="font-mono text-slate-100 print:text-black">{wireSecondary.areaMm2} mm² / Ø{wireSecondary.diameterMm}mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ratios results */}
          <div className="bg-slate-950 p-3 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200 text-xs flex justify-between gap-4 flex-wrap text-slate-300 print:text-slate-850">
            <div>
              <span className="text-[9px] text-slate-500">EMF Per Turn ($E_t$)</span>
              <div className="font-mono font-bold mt-0.5 text-slate-100 print:text-black">{emfPerTurnEt.toFixed(4)} Volts/turn</div>
            </div>
            <div>
              <span className="text-[9px] text-slate-500">Theoretical Turns Ratio</span>
              <div className="font-mono font-bold mt-0.5 text-slate-100 print:text-black">{actualTurnsRatio.toFixed(4)}</div>
            </div>
            <div>
              <span className="text-[9px] text-slate-500">Actual Out Volt</span>
              <div className="font-mono font-bold mt-0.5 text-slate-100 print:text-black">{actualVSecondary.toFixed(2)} V RMS</div>
            </div>
            <div>
              <span className="text-[9px] text-slate-500">Voltage Ratio Error</span>
              <div className={`font-mono font-bold mt-0.5 ${turnsRatioError > 2 ? 'text-rose-400' : 'text-emerald-400'} print:text-black`}>
                {turnsRatioError.toFixed(3)}%
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: GEOMETRICAL CORE DIMENSIONS */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 print:text-slate-700 print:border-slate-300">
            3. Core Geometrical Blueprint (Swiss mm Standard)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-indigo-350 print:text-slate-850">
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Circ Diameter (d)</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{circDiameterMm} mm</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Limb Width / Depth</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{coreWidthAMm} mm / {coreDepthBMm} mm</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Window Dimensions</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{windowWidthWwMm}mm × {windowHeightHwMm}mm</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Yoke Height / Depth</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{yokeHeightHyMm} mm / {yokeWidthDyMm} mm</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-indigo-350 print:text-slate-850 mt-1">
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Overall Assembly width (W)</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{yokeLengthWMm} mm</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase">Overall Assembly height (H)</span>
              <span className="font-bold text-slate-100 print:text-black mt-1">{overallHeightHMm} mm</span>
            </div>
            <div className="flex flex-col bg-slate-950 px-3 py-2 rounded border border-slate-900 print:bg-slate-50 print:border-slate-200 col-span-2">
              <span className="text-[9px] text-slate-500 uppercase">Material Alloy & Saturation Limit</span>
              <span className="font-mono font-bold text-slate-100 print:text-black mt-1">
                {activeMaterial.name} ({operatingBm} / {activeMaterial.maxFluxDensity} T limit)
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: MASS & LOSSES THERMALS */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 print:text-slate-700 print:border-slate-300">
            4. Mass Mechanics, Losses, & Thermal Management
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 print:bg-slate-50 print:border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 print:text-slate-700 uppercase font-mono">WEIGHT ASSESSMENT</span>
              <div className="grid grid-cols-2 gap-y-1.5 mt-3 text-slate-300 print:text-slate-850">
                <span className="text-slate-500">Iron Core Weight:</span>
                <span className="font-mono font-bold text-right print:text-black">{ironWeightKg.toFixed(2)} kg</span>
                
                <span className="text-slate-500">Copper Windings:</span>
                <span className="font-mono font-bold text-right print:text-black">{totalCopperWeightKg.toFixed(2)} kg</span>
                
                <div className="col-span-2 border-t border-slate-900/50 my-1"></div>
                
                <span className="font-bold text-emerald-400">Total Net Mass:</span>
                <span className="font-mono font-bold text-emerald-400 text-right print:text-black">{totalWeightKg.toFixed(2)} kg</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 print:bg-slate-50 print:border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 print:text-slate-700 uppercase font-mono">WATT LOSSES & EFFICIENCY</span>
              <div className="grid grid-cols-2 gap-y-1.5 mt-3 text-slate-300 print:text-slate-850">
                <span className="text-slate-500">Core Loss ($P_i$):</span>
                <span className="font-mono font-bold text-right print:text-black">{ironLossWatts.toFixed(1)} W</span>
                
                <span className="text-slate-500">{"Copper Loss ($P_{cu}$):"}</span>
                <span className="font-mono font-bold text-right print:text-black">{totalCopperLossWatts.toFixed(1)} W</span>
                
                <div className="col-span-2 border-t border-slate-900/50 my-1"></div>
                
                <span className="text-slate-500">Estimated Total Losses:</span>
                <span className="font-mono font-bold text-right print:text-black">{totalLossWatts.toFixed(1)} W</span>

                <span className="font-bold text-indigo-400">Target Efficiency:</span>
                <span className="font-mono font-bold text-indigo-300 text-right print:text-black">{estimatedEfficiency.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 print:bg-slate-50 print:border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-rose-450 print:text-rose-700 uppercase font-mono">THERMAL PROFILE SUMMARY</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-slate-500">Uncooled Plain Tank Temp Rise:</span>
                <span className="font-mono font-bold text-slate-200 print:text-black mt-1 text-sm">
                  {tempRisePlainCc.toFixed(1)} °C
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500">Cooling Tube System Recommendation:</span>
                <span className="font-mono font-bold text-slate-200 print:text-black mt-1 text-sm">
                  {coolingTubesRequired 
                    ? `REQUIRED (${coolingTubesCount} x 50mm cooling tubes)` 
                    : 'NOT REQUIRED (Standard plain tank sufficient)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PRINT ARCHITECT SIGNATURES (Print only visual decoration) */}
        <div className="hidden print:flex justify-between items-center mt-12 bg-white text-slate-900">
          <div className="flex flex-col text-xs">
            <div className="w-40 border-b border-slate-900 h-8"></div>
            <span className="text-[10px] text-slate-500 mt-1 italic">Authorized Design Engineer Signature</span>
          </div>
          <div className="flex flex-col text-xs text-right">
            <span>AMPIN TRANSFORMER DESIGNER PRO</span>
            <span className="text-[10.5px] text-slate-500">Compliance Standard: IEEE/ANSI C57.12</span>
          </div>
        </div>

      </div>
    </div>
  );
};
