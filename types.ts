
export type UsinaName = 
  | 'Angatuba' 
  | 'Avaré' 
  | 'Carlópolis' 
  | 'Itaporanga' 
  | 'Paranapanema' 
  | 'Piraju' 
  | 'Taquarituba' 
  | 'Ribeirão Claro' 
  | 'Jacarezinho';

export enum MaterialKey {
  BRITA_0 = 'BRITA 0',
  BRITA_1 = 'BRITA 1',
  AREIA_MEDIA = 'AREIA MÉDIA',
  AREIA_BRITA = 'AREIA DE BRITA',
  SILO_1 = 'SILO 1',
  SILO_2 = 'SILO 2'
}

export interface StockData {
  [MaterialKey.BRITA_0]: number;
  [MaterialKey.BRITA_1]: number;
  [MaterialKey.AREIA_MEDIA]: number;
  [MaterialKey.AREIA_BRITA]: number;
  [MaterialKey.SILO_1]: number;
  [MaterialKey.SILO_2]: number;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  action: 'ENTRADA' | 'SAÍDA_RELATÓRIO' | 'RESET';
  details: string;
}

export type UserRole = 'admin' | 'viewer';

export interface AppState {
  currentUsina: UsinaName;
  inventory: Record<UsinaName, StockData>;
  history: Record<UsinaName, HistoryLog[]>;
  userRole?: UserRole;
  isLoggedIn?: boolean;
}

export interface ExtractedReportData {
  [key: string]: number;
}
