
import { UsinaName, MaterialKey, StockData } from './types';

export const USINAS: UsinaName[] = [
  'Angatuba', 
  'Avaré', 
  'Carlópolis', 
  'Itaporanga', 
  'Paranapanema', 
  'Piraju', 
  'Taquarituba', 
  'Ribeirão Claro', 
  'Jacarezinho'
];

export const INITIAL_STOCK: StockData = {
  [MaterialKey.BRITA_0]: 100000,
  [MaterialKey.BRITA_1]: 150000,
  [MaterialKey.AREIA_MEDIA]: 200000,
  [MaterialKey.AREIA_BRITA]: 80000,
  [MaterialKey.SILO_1]: 40000,
  [MaterialKey.SILO_2]: 35000,
};

// Consumption per 8m³ load
export const CONSUMPTION_PER_LOAD = {
  [MaterialKey.BRITA_0]: 2000,
  [MaterialKey.BRITA_1]: 6000,
  [MaterialKey.AREIA_MEDIA]: 6000,
  [MaterialKey.AREIA_BRITA]: 1300,
  CIMENTO: 2000 // Total distributed between Silo 1 and 2
};

export const LOW_STOCK_THRESHOLD = 50000;
export const LOW_STOCK_THRESHOLD_CEMENT = 20000;
