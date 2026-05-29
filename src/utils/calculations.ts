/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransformerDesignInput, TransformerDesignResult, MaterialProperties, WireGauge } from '../types';
import { MATERIALS, COOLING_MODES, findNearestWireGauge } from './constants';

/**
 * Calculates all parameters of the transformer using equations and formulas from the design PDF.
 */
export function calculateTransformerDesign(input: TransformerDesignInput): TransformerDesignResult {
  const {
    coreStyle,
    coreShape,
    materialType,
    powerVa,
    frequency,
    vPrimary,
    vSecondary,
    coolingType,
    currentDensityLimit,
    windowSpaceFactorKw,
    useAutomaticDimensions
  } = input;

  // 1. Load active material characteristics
  let activeMaterial: MaterialProperties;
  if (materialType === 'custom') {
    activeMaterial = {
      id: 'custom',
      name: 'Custom Magnetic Steel',
      minFluxDensity: 0.5,
      maxFluxDensity: 2.0,
      recommendedFluxDensity: input.customFluxDensity || 1.2,
      typicalKi: input.customKi || 0.9,
      laminationThickness: 0.35,
      siliconPercentage: 2.0,
      density: input.customDensity || 7650,
      baseCoreLossFactor: input.customBaseLoss || 1.2,
      description: 'User-specified customized alloy core properties.'
    };
  } else {
    activeMaterial = MATERIALS[materialType] || MATERIALS['crgo'];
  }

  // Operating Flux Density Bm
  const operatingBm = materialType === 'custom' ? input.customFluxDensity : activeMaterial.recommendedFluxDensity;
  const stackingFactorKi = materialType === 'custom' ? input.customKi : activeMaterial.typicalKi;

  // Nominal power in kVA
  const qKva = powerVa / 1000.0;

  // 2. EMF per Turn synthesis (Page 38: Et = K * sqrt(Q_kva))
  // Where K is selected based on construction style (Page 39)
  let kCoeff = 0.8; // Default Single phase core type
  if (coreStyle === '1p-shell') {
    kCoeff = 1.1; // Range 1.0 to 1.2
  } else if (coreStyle === '1p-core') {
    kCoeff = 0.8; // Range 0.75 to 0.85
  } else if (coreStyle === '3p-shell') {
    kCoeff = 1.35;
  } else if (coreStyle === '3p-core') {
    kCoeff = 0.55; // Core type, power/distribution mix (Page 39 gives 0.45 for distribution, 0.6-0.7 for power)
  }

  let synthesizedEt = kCoeff * Math.sqrt(qKva);
  if (synthesizedEt < 0.05) {
    synthesizedEt = 0.05; // Fallback for very small loads
  }

  // Calculate corresponding magnetic flux from synthesized Emf (Et = 4.44 * f * Phi_m)
  const autoPhiM = synthesizedEt / (4.44 * frequency);
  // Auto-derived iron area in m^2
  const autoAi = autoPhiM / operatingBm;

  // kcFactor = Ai / d^2 (based on Page 49: Square=0.45, Cruciform=0.56, 3-stepped=0.6, 4-stepped=0.62)
  let kcFactor = 0.56; // Cruciform default
  if (coreShape === 'square') kcFactor = 0.45;
  else if (coreShape === 'cruciform') kcFactor = 0.56;
  else if (coreShape === '3-stepped') kcFactor = 0.60;
  else if (coreShape === '4-stepped') kcFactor = 0.62;
  else if (coreShape === 'rectangular') kcFactor = 0.52; // Aspect 1.5 typical

  // Auto-derived circumscribing circle diameter d (m)
  const autoD = Math.sqrt(autoAi / kcFactor);
  const autoDMm = Math.max(12, Math.round(autoD * 1000.0));

  // Auto window space factor scaling (Page 50: Kw = 10 / (30 + kV))
  const kvHw = Math.max(vPrimary, vSecondary) / 1000.0;
  const autoKw = parseFloat((10.0 / (30.0 + kvHw)).toFixed(3));

  // Determine active geometry inputs
  let circDiameterMm = 0;
  let coreWidthAMm = 0;
  let coreDepthBMm = 0;

  if (useAutomaticDimensions) {
    circDiameterMm = autoDMm;
    // Derive width 'a' and depth 'b' based on Page 47/49
    if (coreShape === 'square') {
      coreWidthAMm = Math.round(circDiameterMm / Math.sqrt(2)); // side of square
      coreDepthBMm = coreWidthAMm;
    } else if (coreShape === 'cruciform') {
      coreWidthAMm = Math.round(0.85 * circDiameterMm); // Page 47: a = 0.85d
      coreDepthBMm = Math.round(0.53 * circDiameterMm); // Page 47: b = 0.53d
    } else if (coreShape === '3-stepped') {
      coreWidthAMm = Math.round(0.90 * circDiameterMm);
      coreDepthBMm = Math.round(0.60 * circDiameterMm);
    } else if (coreShape === '4-stepped') {
      coreWidthAMm = Math.round(0.92 * circDiameterMm);
      coreDepthBMm = Math.round(0.64 * circDiameterMm);
    } else { // rectangular
      coreWidthAMm = Math.round(circDiameterMm * 0.7);
      coreDepthBMm = Math.round(coreWidthAMm * 1.4);
    }
  } else {
    circDiameterMm = input.dCircumscribing || autoDMm;
    if (coreShape === 'rectangular') {
      coreWidthAMm = input.rectCoreWidth || Math.round(circDiameterMm * 0.7);
      coreDepthBMm = input.rectCoreDepth || Math.round(coreWidthAMm * 1.5);
    } else {
      // derive standard dimensions from user-specified circumscribing diameter
      if (coreShape === 'square') {
        coreWidthAMm = Math.round(circDiameterMm / Math.sqrt(2));
        coreDepthBMm = coreWidthAMm;
      } else if (coreShape === 'cruciform') {
        coreWidthAMm = Math.round(0.85 * circDiameterMm);
        coreDepthBMm = Math.round(0.53 * circDiameterMm);
      } else if (coreShape === '3-stepped') {
        coreWidthAMm = Math.round(0.90 * circDiameterMm);
        coreDepthBMm = Math.round(0.60 * circDiameterMm);
      } else { // 4 stepped
        coreWidthAMm = Math.round(0.92 * circDiameterMm);
        coreDepthBMm = Math.round(0.64 * circDiameterMm);
      }
    }
  }

  // 3. Compute Area Definitions
  let grossCoreAreaAgi = 0; // m^2
  if (coreShape === 'rectangular') {
    grossCoreAreaAgi = (coreWidthAMm * coreDepthBMm) * 1e-6;
  } else {
    // Agi based on page 49 table: Square=64% of circ circle area, Cruciform=79%, 3-stepped=84%, 4-stepped=87%
    let areaFactor = 0.79;
    if (coreShape === 'square') areaFactor = 0.64;
    else if (coreShape === 'cruciform') areaFactor = 0.79;
    else if (coreShape === '3-stepped') areaFactor = 0.84;
    else if (coreShape === '4-stepped') areaFactor = 0.87;
    
    const circleArea = (Math.PI / 4.0) * Math.pow(circDiameterMm * 1e-3, 2);
    grossCoreAreaAgi = areaFactor * circleArea;
  }

  // Net iron area (Ai = Ki * Agi)
  const netIronAreaAi = stackingFactorKi * grossCoreAreaAgi;

  // Precise Operating flux from active area (PhiM = Bm * Ai)
  const fluxValuePhiM = operatingBm * netIronAreaAi; // Webers

  // Emf per turn based on exact area (Et = 4.44 * f * PhiM) -> For 3-Phase, EMF is per phase
  const emfPerTurnEt = 4.44 * frequency * fluxValuePhiM;

  // 4. Electrical winding counts & ratios
  const vSecondaryEffective = input.centerTappedSecondary ? (vSecondary * 2.0) : vSecondary;

  let turnsPrimaryTp = Math.round(vPrimary / emfPerTurnEt);
  let turnsSecondaryTs = Math.round(vSecondaryEffective / emfPerTurnEt);

  // Safety guards
  if (turnsPrimaryTp < 1) turnsPrimaryTp = 1;
  if (turnsSecondaryTs < 1) turnsSecondaryTs = 1;

  // If center tapped, ensure Ts is an even integer so that the two halves are perfectly symmetrical
  if (input.centerTappedSecondary && turnsSecondaryTs % 2 !== 0) {
    turnsSecondaryTs += 1;
  }

  const actualTurnsRatio = turnsPrimaryTp / turnsSecondaryTs;
  const expectedTurnsRatio = vPrimary / vSecondaryEffective;
  const actualVSecondary = vPrimary / actualTurnsRatio;
  const turnsRatioError = Math.abs((actualVSecondary - vSecondaryEffective) / vSecondaryEffective) * 100.0;

  // 5. Currents and sizing
  let currentPrimaryIp = 0;
  let currentSecondaryIs = 0;

  const activeSpaceFactorKw = useAutomaticDimensions ? autoKw : (input.windowSpaceFactorKw || autoKw);
  const activeCurrentDensity = useAutomaticDimensions ? (COOLING_MODES[coolingType]?.nominalDelta || 2.0) : currentDensityLimit;

  // Check 3-phase vs 1-phase current calculation (Page 57 for 3-phase vs standard single phase)
  const isThreePhase = coreStyle.startsWith('3p');
  if (isThreePhase) {
    // For 3-Phase, VA ratings are multi-phase. Line vs Phase current: assume Star connection (Y) per phase:
    // Ip = S / (3 * Vp) -> Page 57: Ip = Q * 10^-3 / (3 * Vp) where Q is in VA
    currentPrimaryIp = powerVa / (3.0 * vPrimary);
    currentSecondaryIs = powerVa / (3.0 * vSecondaryEffective);
  } else {
    // 1-Phase: Ip = S / Vp
    currentPrimaryIp = powerVa / vPrimary;
    currentSecondaryIs = powerVa / vSecondaryEffective;
  }

  // Required sectional areas of winding conductors
  // ap = Ip / delta, as = Is / delta
  const conductorAreaPrimaryAp = currentPrimaryIp / activeCurrentDensity; // mm^2
  const conductorAreaSecondaryAs = currentSecondaryIs / activeCurrentDensity; // mm^2

  // Match closest wire gauges from standard pool based on selected wire standard
  const wirePrimary = findNearestWireGauge(conductorAreaPrimaryAp, input.wireStandard || 'awg');
  const wireSecondary = findNearestWireGauge(conductorAreaSecondaryAs, input.wireStandard || 'awg');

  // 6. Window Geometry Allocation (Page 51)
  // Total Conductor Area in Window (Ac):
  // 1-Phase has 1 window carrying primary and secondary windings (Page 51: Aw = 2 * ap * Tp / Kw)
  // 3-Phase has windows carrying windings for adjacent phases (Page 51: Aw = 4 * ap * Tp / Kw)
  const activeConductorAreaM2 = (turnsPrimaryTp * (wirePrimary.areaMm2 * 1e-6) + turnsSecondaryTs * (wireSecondary.areaMm2 * 1e-6));
  
  // Suggested Window Area
  const suggestedAwM2 = activeConductorAreaM2 / activeSpaceFactorKw;
  const suggestedWw = Math.sqrt(suggestedAwM2 / 3.0); // 3:1 typical height/width
  const suggestedHw = 3.0 * suggestedWw;

  let windowWidthWwMm = 0;
  let windowHeightHwMm = 0;

  if (useAutomaticDimensions) {
    windowWidthWwMm = Math.max(15, Math.round(suggestedWw * 1000.0));
    windowHeightHwMm = Math.max(30, Math.round(suggestedHw * 1000.0));
  } else {
    windowWidthWwMm = input.windowWidth || Math.max(15, Math.round(suggestedWw * 1000.0));
    windowHeightHwMm = input.windowHeight || Math.max(30, Math.round(suggestedHw * 1000.0));
  }

  // 7. Overall Core Construction Dimensions (Page 53/55/56)
  let yokeWidthDyMm = coreWidthAMm; // Rectangular yoke width
  let yokeHeightHyMm = coreWidthAMm; // Standard rectangular yoke height Hy = a (Page 52)
  let yokeAreaAyM2 = grossCoreAreaAgi; // Stacking equals core, CRGO Ay = Agi (Page 52)

  if (materialType !== 'crgo') {
    // Hot Rolled steel requires slightly larger yoke area to minimize core losses (Ay = 1.15 to 1.25 Agi, Page 52)
    yokeHeightHyMm = Math.round(yokeHeightHyMm * 1.2);
    yokeAreaAyM2 = yokeAreaAyM2 * 1.2;
  }

  let centerDistanceDMm = circDiameterMm + windowWidthWwMm; // D = d + Ww (Page 53)
  let yokeLengthWMm = 0;
  let overallHeightHMm = 0;

  if (coreStyle === '1p-core') {
    // Page 55: W = D + a
    yokeLengthWMm = centerDistanceDMm + coreWidthAMm;
    // Page 55: H = Hw + 2Hy
    overallHeightHMm = windowHeightHwMm + 2 * yokeHeightHyMm;
  } else if (coreStyle === '1p-shell') {
    // Page 56: W = 2Ww + 4a
    yokeLengthWMm = 2 * windowWidthWwMm + 4 * coreWidthAMm;
    // Page 56: H = Hw + 2a (where a = Hy = yoke height)
    overallHeightHMm = windowHeightHwMm + 2 * coreWidthAMm;
  } else if (coreStyle === '3p-core') {
    // Page 55: W = 2D + a
    yokeLengthWMm = 2 * centerDistanceDMm + coreWidthAMm;
    // Page 55: H = Hw + 2Hy
    overallHeightHMm = windowHeightHwMm + 2 * yokeHeightHyMm;
  } else { // 3-phase shell type (approximate standard sizing ratio)
    yokeLengthWMm = 3 * centerDistanceDMm + coreWidthAMm;
    overallHeightHMm = windowHeightHwMm + 3 * yokeHeightHyMm;
  }

  // 8. Physical Weight Calculations (Page 65)
  // Density of steel: activeMaterial.density
  // Volume of legs = Net iron area Ai * Hw * number of limbs
  let numberOfLimbs = 2; // For 1-Phase Core/Shell
  if (coreStyle === '3p-core') numberOfLimbs = 3;
  else if (coreStyle === '3p-shell') numberOfLimbs = 3;

  const legVolumeM3 = netIronAreaAi * (windowHeightHwMm * 1e-3) * numberOfLimbs;

  // Volume of Yokes = Ay * Yoke length * number of yokes (usually 2 yokes, top and bottom)
  const numberOfYokes = 2;
  const yokeVolumeM3 = yokeAreaAyM2 * (yokeLengthWMm * 1e-3) * numberOfYokes;

  const ironLegWeightKg = legVolumeM3 * activeMaterial.density;
  const ironYokeWeightKg = yokeVolumeM3 * activeMaterial.density;
  const ironWeightKg = ironLegWeightKg + ironYokeWeightKg;

  // Mean Length of Turn (Lmt) Calculations (Page 58)
  // Lmt_p = pi * mean_diameter
  // For simplicity and accuracy in stepped design, the inner winding sits right around the core.
  // We place LV closer to core to reduce insulation height (Page 13).
  // Mean diameter of inner winding (Primary, usually lower voltage): core equivalent diameter + insulation space + half conductor height
  const equivalentCoreDiameterMm = circDiameterMm;
  const lmtPrimaryMm = Math.PI * (equivalentCoreDiameterMm + windowWidthWwMm * 0.25); // inner layer
  const lmtSecondaryMm = Math.PI * (equivalentCoreDiameterMm + windowWidthWwMm * 0.75); // outer layer

  // Total copper lengths (meters)
  const totalLengthPrimaryM = (turnsPrimaryTp * lmtPrimaryMm * 1e-3) * (isThreePhase ? 3 : 1);
  const totalLengthSecondaryM = (turnsSecondaryTs * lmtSecondaryMm * 1e-3) * (isThreePhase ? 3 : 1);

  // Copper weights: density of copper is approx 8890 kg/m^3 -> weight in kg = length(m) * area(mm^2) * 8.89e-3
  const copperWeightPrimaryKg = totalLengthPrimaryM * wirePrimary.areaMm2 * 8.89e-3;
  const copperWeightSecondaryKg = totalLengthSecondaryM * wireSecondary.areaMm2 * 8.89e-3;
  const totalCopperWeightKg = copperWeightPrimaryKg + copperWeightSecondaryKg;

  const totalWeightKg = ironWeightKg + totalCopperWeightKg;

  // 9. Core & Winding Copper Losses
  // Core loss (Watts) = Loss Factor W/kg * Base weight.
  // Core loss changes with frequency: P ~ f^1.6 or proportional.
  const freqScalingFactor = Math.pow(frequency / 50.0, 1.4);
  const coreLossPerKg = activeMaterial.baseCoreLossFactor * freqScalingFactor * Math.pow(operatingBm / 1.5, 2.0);
  const ironLossWatts = ironWeightKg * coreLossPerKg;

  // Resistance: rp = (rho * Lmt * Tp) / ap (Page 58)
  // Standard copper resistivity at 75C load: rho ~ 0.021 ohm * mm^2 / meter
  const r75Resistivity = 0.021;
  const resPrimaryOhm = (r75Resistivity * (totalLengthPrimaryM / (isThreePhase ? 3 : 1))) / wirePrimary.areaMm2;
  const resSecondaryOhm = (r75Resistivity * (totalLengthSecondaryM / (isThreePhase ? 3 : 1))) / wireSecondary.areaMm2;

  // Copper losses under nominal loads: I^2 * R
  const copperLossPrimaryWatts = Math.pow(currentPrimaryIp, 2) * resPrimaryOhm * (isThreePhase ? 3 : 1);
  const copperLossSecondaryWatts = Math.pow(currentSecondaryIs, 2) * resSecondaryOhm * (isThreePhase ? 3 : 1);
  const totalCopperLossWatts = copperLossPrimaryWatts + copperLossSecondaryWatts;

  const totalLossWatts = ironLossWatts + totalCopperLossWatts;

  // Electrical Efficiency %
  const estimatedEfficiency = (powerVa / (powerVa + totalLossWatts)) * 100.0;

  // 10. Thermal Plain Tan Temperature Rise (Page 69)
  // St = Heat dissipating surface of tank (estimation based on overall structural layout)
  // Tank dimensions: Width = W_yoke + 2 * clearance(50mm), Depth = D_core_depth + 2 * clearance(50mm), Height = H_overall + 2 * clearance(80mm)
  const tankWidthM = (yokeLengthWMm + 100) * 1e-3;
  const tankDepthM = (coreDepthBMm * 2 + 100) * 1e-3; // Double core depth to allow coil spacing
  const tankHeightM = (overallHeightHMm + 160) * 1e-3;

  // Plain rectangular tank surface area S_t = 2 * (W*D + W*H + D*H) excluding top/bottom sometimes, but we include vertical walls:
  // standard external convection wall area = 2 * H * (W + D)
  const tankSurfaceSt = 2 * tankHeightM * (tankWidthM + tankDepthM);

  // Plain walled tank convection loss = 12.5 W/m^2-C (6.0 Radiation + 6.5 Convection, Page 69)
  const tempRisePlainCc = totalLossWatts / (12.5 * tankSurfaceSt);

  // If temp rise exceeds 50 degrees, cooling tubes or cooling fins are required (Page 70)
  const coolingTubesRequired = tempRisePlainCc > 50.0;
  let coolingTubesCount = 0;

  if (coolingTubesRequired) {
    // Add cooling tubes with 50mm diameter (Page 72) and spacing at 75mm
    // Length of each tube lt ~ 0.8 * Tank height
    const ltM = tankHeightM * 0.8;
    const dtM = 0.05; // 50 mm
    const areaOneTube = Math.PI * dtM * ltM; // area per tube
    
    // We want to reduce temp rise down to 45°C
    // Page 71: x = (1/8.8) * ((Pi+Pc)/(St * theta) - 12.5) where area of tubes = x * St
    const targetTheta = 45.0;
    const numerator = totalLossWatts;
    const denominator = tankSurfaceSt * targetTheta;
    const x = (1.0 / 8.8) * ((numerator / denominator) - 12.5);
    
    if (x > 0) {
      const requiredTubesArea = x * tankSurfaceSt;
      coolingTubesCount = Math.ceil(requiredTubesArea / areaOneTube);
    }
  }

  return {
    inputs: input,
    activeMaterial,
    operatingBm,
    stackingFactorKi,
    kcFactor,
    grossCoreAreaAgi,
    netIronAreaAi,
    fluxValuePhiM,
    emfPerTurnEt,
    turnsPrimaryTp,
    turnsSecondaryTs,
    actualTurnsRatio,
    expectedTurnsRatio,
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
    yokeAreaAyM2,
    windowWidthWwMm,
    windowHeightHwMm,
    yokeLengthWMm,
    overallHeightHMm,
    centerDistanceDMm,
    ironWeightKg,
    copperWeightPrimaryKg,
    copperWeightSecondaryKg,
    totalCopperWeightKg,
    totalWeightKg,
    ironLossWatts,
    copperLossPrimaryWatts,
    copperLossSecondaryWatts,
    totalCopperLossWatts,
    totalLossWatts,
    estimatedEfficiency,
    tankSurfaceSt,
    tempRisePlainCc,
    coolingTubesRequired,
    coolingTubesCount
  };
}
