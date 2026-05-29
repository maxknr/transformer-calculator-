/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CoreStyle = '1p-core' | '1p-shell' | '3p-core' | '3p-shell';

export type CoreShape = 'square' | 'cruciform' | '3-stepped' | '4-stepped' | 'rectangular';

export type MaterialType = 'normal-si' | 'hrgo' | 'crgo' | 'custom';

export type CoolingType = 'AN' | 'ON' | 'OFN' | 'AB' | 'OB' | 'OFB' | 'OW' | 'OFW';

export interface MaterialProperties {
  id: MaterialType;
  name: string;
  minFluxDensity: number; // Tesla
  maxFluxDensity: number; // Tesla
  recommendedFluxDensity: number; // Tesla
  typicalKi: number; // Stacking factor (usually around 0.9)
  laminationThickness: number; // mm
  siliconPercentage: number; // %
  density: number; // kg/m^3
  baseCoreLossFactor: number; // W/kg at 1.5T 50Hz (or similar)
  description: string;
}

export interface WireGauge {
  awg: number;
  name: string;
  standard: 'awg' | 'swg' | 'metric';
  diameterMm: number;
  areaMm2: number;
  resistanceOhmPerMeter: number;
  weightKgPerKm: number;
  maxCurrentAt2A: number; // Amps
  maxCurrentAt3A: number; // Amps
}

export interface TransformerDesignInput {
  coreStyle: CoreStyle;
  coreShape: CoreShape;
  materialType: MaterialType;
  customKi: number;
  customFluxDensity: number;
  customDensity: number;
  customBaseLoss: number;
  
  // Electrical ratings
  powerVa: number;
  frequency: number; // Hz (50, 60, 400 etc)
  vPrimary: number; // Volts
  vSecondary: number; // Volts
  centerTappedSecondary?: boolean;
  
  // Cooling & Electrical constraints
  coolingType: CoolingType;
  currentDensityLimit: number; // A/mm^2
  windowSpaceFactorKw: number; // 0 to 1
  wireStandard?: 'awg' | 'swg' | 'metric';
  
  // Custom Core dimensions (if user-defined)
  useAutomaticDimensions: boolean;
  dCircumscribing: number; // mm
  rectCoreWidth: number; // mm (for rectangular core)
  rectCoreDepth: number; // mm (for rectangular core)
  
  // Window proportions
  windowHeight: number; // mm
  windowWidth: number; // mm
}

export interface TransformerDesignResult {
  inputs: TransformerDesignInput;
  
  // Material stats
  activeMaterial: MaterialProperties;
  operatingBm: number; // Tesla
  stackingFactorKi: number;
  
  // Core areas and factors
  kcFactor: number; // Ai/d^2 factor
  grossCoreAreaAgi: number; // m^2
  netIronAreaAi: number; // m^2
  fluxValuePhiM: number; // Weber
  
  // Winding calculations
  emfPerTurnEt: number; // Volts/turn
  turnsPrimaryTp: number;
  turnsSecondaryTs: number;
  actualTurnsRatio: number;
  expectedTurnsRatio: number;
  actualVSecondary: number; // Volts
  turnsRatioError: number; // %
  
  // Currents and sizes
  currentPrimaryIp: number; // A
  currentSecondaryIs: number; // A
  conductorAreaPrimaryAp: number; // mm^2
  conductorAreaSecondaryAs: number; // mm^2
  wirePrimary: WireGauge;
  wireSecondary: WireGauge;
  
  // Core dimensions and weights
  circDiameterMm: number;
  coreWidthAMm: number; // width of central limb or largest core stamp
  coreDepthBMm: number; // depth of largest core stamp
  yokeWidthDyMm: number; // mm
  yokeHeightHyMm: number; // mm
  yokeAreaAyM2: number; // m^2
  
  // Frame dimensions (Page 53/56)
  windowWidthWwMm: number;
  windowHeightHwMm: number;
  yokeLengthWMm: number;
  overallHeightHMm: number;
  centerDistanceDMm: number; // D = d + Ww
  
  // Weights (copper & iron)
  ironWeightKg: number;
  copperWeightPrimaryKg: number;
  copperWeightSecondaryKg: number;
  totalCopperWeightKg: number;
  totalWeightKg: number;
  
  // Losses and Efficiencies
  ironLossWatts: number;
  copperLossPrimaryWatts: number;
  copperLossSecondaryWatts: number;
  totalCopperLossWatts: number;
  totalLossWatts: number;
  estimatedEfficiency: number; // %
  
  // Heating and Tanks
  tankSurfaceSt: number; // m^2
  tempRisePlainCc: number; // °C temperature rise of plain tank
  coolingTubesRequired: boolean;
  coolingTubesCount: number;
}
