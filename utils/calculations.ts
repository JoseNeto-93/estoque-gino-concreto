
import { StockData, MaterialKey } from '../types';
import { CONSUMPTION_PER_LOAD } from '../constants';

export const calculateEstimates = (stock: StockData) => {
  const b0Loads = stock[MaterialKey.BRITA_0] / CONSUMPTION_PER_LOAD[MaterialKey.BRITA_0];
  const b1Loads = stock[MaterialKey.BRITA_1] / CONSUMPTION_PER_LOAD[MaterialKey.BRITA_1];
  const amLoads = stock[MaterialKey.AREIA_MEDIA] / CONSUMPTION_PER_LOAD[MaterialKey.AREIA_MEDIA];
  const abLoads = stock[MaterialKey.AREIA_BRITA] / CONSUMPTION_PER_LOAD[MaterialKey.AREIA_BRITA];

  // The material with the lowest remaining capacity defines the limit
  const maxLoads = Math.floor(Math.min(b0Loads, b1Loads, amLoads, abLoads));
  const totalM3 = maxLoads * 8;

  return {
    maxLoads: Math.max(0, maxLoads),
    totalM3: Math.max(0, totalM3)
  };
};

export const formatKg = (val: number) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg';
};

export const formatM3 = (val: number) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' m³';
};
