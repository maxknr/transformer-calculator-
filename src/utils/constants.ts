/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaterialProperties, CoolingType, WireGauge } from '../types';

export const MATERIALS: Record<string, MaterialProperties> = {
  'normal-si': {
    id: 'normal-si',
    name: 'Normal Silicon Steel (Non-Oriented)',
    minFluxDensity: 0.9,
    maxFluxDensity: 1.1,
    recommendedFluxDensity: 1.0,
    typicalKi: 0.90,
    laminationThickness: 0.35,
    siliconPercentage: 2.5,
    density: 7650,
    baseCoreLossFactor: 1.8, // W/kg at 1.0T, 50Hz
    description: 'Standard multi-directional silicon laminations. Easy to punch, cheap, has moderate core losses. Best for generic, low-cost utility projects.'
  },
  'hrgo': {
    id: 'hrgo',
    name: 'Hot Rolled Grain Oriented (HRGO)',
    minFluxDensity: 1.2,
    maxFluxDensity: 1.4,
    recommendedFluxDensity: 1.3,
    typicalKi: 0.90,
    laminationThickness: 0.35,
    siliconPercentage: 3.0,
    density: 7700,
    baseCoreLossFactor: 1.3, // W/kg at 1.3T, 50Hz
    description: 'Grain-oriented steel processed on hot mills. Higher saturation thresholds and improved permeability along the rolling path.'
  },
  'crgo': {
    id: 'crgo',
    name: 'Cold Rolled Grain Oriented (CRGO)',
    minFluxDensity: 1.4,
    maxFluxDensity: 1.7,
    recommendedFluxDensity: 1.55,
    typicalKi: 0.92,
    laminationThickness: 0.23, // 0.14 - 0.28 range
    siliconPercentage: 3.2,
    density: 7750,
    baseCoreLossFactor: 0.85, // W/kg at 1.5T, 50Hz
    description: 'Premium grain-oriented steel optimized via cold rolling. Extremely high magnetic saturation limits, minimum hysteresis losses along the rolling direction.'
  }
};

export interface CoolingProperties {
  id: CoolingType;
  name: string;
  minDelta: number; // A/mm^2
  maxDelta: number; // A/mm^2
  nominalDelta: number; // A/mm^2
  description: string;
}

export const COOLING_MODES: Record<CoolingType, CoolingProperties> = {
  'AN': {
    id: 'AN',
    name: 'AN (Air Natural)',
    minDelta: 1.5,
    maxDelta: 2.3,
    nominalDelta: 1.8,
    description: 'Dry type cooling with ambient air circulating by natural convection. Safest and simplest, best for small transformers.'
  },
  'ON': {
    id: 'ON',
    name: 'ON (Oil Natural)',
    minDelta: 1.5,
    maxDelta: 2.3,
    nominalDelta: 2.0,
    description: 'Liquid-immersed in mineral oil with natural circulation. Offers high dielectric isolation and uniform heat dispersal.'
  },
  'OFN': {
    id: 'OFN',
    name: 'OFN (Oil Forced Natural Air)',
    minDelta: 1.8,
    maxDelta: 2.6,
    nominalDelta: 2.2,
    description: 'Oil is pumped through external radiator tubes with natural air currents sweeping the fins.'
  },
  'AB': {
    id: 'AB',
    name: 'AB (Air Blast)',
    minDelta: 2.2,
    maxDelta: 4.0,
    nominalDelta: 2.8,
    description: 'Dry type transformer using forced blowers to accelerate air speed across exposed windings.'
  },
  'OB': {
    id: 'OB',
    name: 'OB (Oil Blast / Air Blast)',
    minDelta: 2.2,
    maxDelta: 4.0,
    nominalDelta: 3.2,
    description: 'Oil immersed with cooling fans blowing across the radiator columns to significantly boost cooling rates.'
  },
  'OFB': {
    id: 'OFB',
    name: 'OFB (Oil Forced Air Blast)',
    minDelta: 2.5,
    maxDelta: 4.5,
    nominalDelta: 3.6,
    description: 'Combined pump-forced oil circulation and fan-forced atmospheric cooling for high-power distribution gear.'
  },
  'OW': {
    id: 'OW',
    name: 'OW (Oil Natural Water Forced)',
    minDelta: 5.0,
    maxDelta: 6.0,
    nominalDelta: 5.2,
    description: 'Mineral oil cooled via internal copper heat-exchanger coils circulating pressurized cold water.'
  },
  'OFW': {
    id: 'OFW',
    name: 'OFW (Oil Forced Water Forced)',
    minDelta: 5.0,
    maxDelta: 6.5,
    nominalDelta: 5.8,
    description: 'Closed-loop accelerated oil pump flowing through a heavy duty external water heat exchanger. Maximum professional compact density.'
  }
};

/**
 * Standard AWG (American Wire Gauge) Calculation Formula
 * d_awg = 0.127 * 92^((36-AWG)/39) mm
 */
export function getAwgProperties(awg: number): WireGauge {
  const diameterMm = 0.127 * Math.pow(92, (36 - awg) / 39);
  const areaMm2 = (Math.PI / 4) * Math.pow(diameterMm, 2);
  
  // Resistance on annealed copper at 20°C: rho = 1.724e-8 meter*ohm = 0.01724 mm^2 * ohm / meter
  // At operating hot temp (e.g. 75C), rho rises about 20% to ~0.021, but standard nominal datasheet lists at 20C.
  const resistanceOhmPerMeter = 0.01724 / areaMm2;
  
  // Mass of copper: density is 8.89 g/cm^3 = 8890 kg/m^3.
  const weightKgPerKm = areaMm2 * 8.89; // kg per km is equivalent to g per meter
  
  return {
    awg,
    name: `AWG ${awg}`,
    standard: 'awg',
    diameterMm: parseFloat(diameterMm.toFixed(4)),
    areaMm2: parseFloat(areaMm2.toFixed(4)),
    resistanceOhmPerMeter: parseFloat(resistanceOhmPerMeter.toFixed(5)),
    weightKgPerKm: parseFloat(weightKgPerKm.toFixed(3)),
    maxCurrentAt2A: parseFloat((areaMm2 * 2.0).toFixed(2)),
    maxCurrentAt3A: parseFloat((areaMm2 * 3.0).toFixed(2))
  };
}

// Generate cached lookup array for fast searching of nearest gauge
export const AWG_TABLE: WireGauge[] = Array.from({ length: 41 }, (_, i) => getAwgProperties(i + 4)); // AWG 4 to AWG 44

export const SWG_DIAMETERS: Record<number, number> = {
  4: 5.893, 5: 5.385, 6: 4.877, 7: 4.470, 8: 4.064, 9: 3.658,
  10: 3.251, 11: 2.946, 12: 2.642, 13: 2.337, 14: 2.032, 15: 1.829,
  16: 1.626, 17: 1.422, 18: 1.219, 19: 1.016, 20: 0.914, 21: 0.813,
  22: 0.711, 23: 0.610, 24: 0.559, 25: 0.508, 26: 0.457, 27: 0.417,
  28: 0.376, 29: 0.345, 30: 0.315, 31: 0.295, 32: 0.274, 33: 0.254,
  34: 0.234, 35: 0.213, 36: 0.193, 37: 0.173, 38: 0.152, 39: 0.132,
  40: 0.122, 41: 0.112, 42: 0.102, 43: 0.091, 44: 0.081
};

export function getSwgProperties(swg: number): WireGauge {
  const diameterMm = SWG_DIAMETERS[swg] || 0.1219;
  const areaMm2 = (Math.PI / 4) * Math.pow(diameterMm, 2);
  const resistanceOhmPerMeter = 0.01724 / areaMm2;
  const weightKgPerKm = areaMm2 * 8.89;
  
  return {
    awg: swg,
    name: `SWG ${swg}`,
    standard: 'swg',
    diameterMm: parseFloat(diameterMm.toFixed(4)),
    areaMm2: parseFloat(areaMm2.toFixed(4)),
    resistanceOhmPerMeter: parseFloat(resistanceOhmPerMeter.toFixed(5)),
    weightKgPerKm: parseFloat(weightKgPerKm.toFixed(3)),
    maxCurrentAt2A: parseFloat((areaMm2 * 2.0).toFixed(2)),
    maxCurrentAt3A: parseFloat((areaMm2 * 3.0).toFixed(2))
  };
}

export const SWG_TABLE: WireGauge[] = Object.keys(SWG_DIAMETERS).map(k => getSwgProperties(parseInt(k))).sort((a,b) => a.awg - b.awg);

const METRIC_AREAS = [0.05, 0.08, 0.12, 0.20, 0.35, 0.50, 0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0];

export function getMetricProperties(areaMm2: number, index: number): WireGauge {
  const diameterMm = Math.sqrt(4 * areaMm2 / Math.PI);
  const resistanceOhmPerMeter = 0.01724 / areaMm2;
  const weightKgPerKm = areaMm2 * 8.89;
  
  return {
    awg: index + 1,
    name: `${areaMm2} mm²`,
    standard: 'metric',
    diameterMm: parseFloat(diameterMm.toFixed(4)),
    areaMm2: parseFloat(areaMm2.toFixed(4)),
    resistanceOhmPerMeter: parseFloat(resistanceOhmPerMeter.toFixed(5)),
    weightKgPerKm: parseFloat(weightKgPerKm.toFixed(3)),
    maxCurrentAt2A: parseFloat((areaMm2 * 2.0).toFixed(2)),
    maxCurrentAt3A: parseFloat((areaMm2 * 3.0).toFixed(2))
  };
}

export const METRIC_TABLE: WireGauge[] = METRIC_AREAS.map((area, i) => getMetricProperties(area, i));

/**
 * Search closest gauge for a required conductor cross section
 */
export function findNearestWireGauge(requiredAreaMm2: number, standard: 'awg' | 'swg' | 'metric' = 'awg'): WireGauge {
  const table = standard === 'metric' ? METRIC_TABLE : (standard === 'swg' ? SWG_TABLE : AWG_TABLE);
  let closest = table[0];
  let minDiff = Math.abs(table[0].areaMm2 - requiredAreaMm2);
  
  for (const gauge of table) {
    const diff = Math.abs(gauge.areaMm2 - requiredAreaMm2);
    // Prefer wire gauges that are larger (having lower AWG code numbers or larger areas) to handle safety margins
    if (gauge.areaMm2 >= requiredAreaMm2 && diff < minDiff * 1.5) {
      closest = gauge;
      minDiff = diff;
    } else if (diff < minDiff) {
      closest = gauge;
      minDiff = diff;
    }
  }
  return closest;
}
