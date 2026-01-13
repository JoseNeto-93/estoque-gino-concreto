
import React from 'react';
import { MaterialKey } from '../types';
import { formatKg } from '../utils/calculations';
import { LOW_STOCK_THRESHOLD } from '../constants';

interface StockCardProps {
  label: string | MaterialKey;
  value: number;
  icon?: React.ReactNode;
  onEdit?: () => void;
  threshold?: number;
}

const StockCard: React.FC<StockCardProps> = ({ label, value, icon, onEdit, threshold }) => {
  const limit = threshold ?? LOW_STOCK_THRESHOLD;
  const isLow = value < limit;

  return (
    <div className={`p-5 rounded-2xl shadow-sm border transition-all relative group ${
      isLow ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Editar saldo manualmente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <div className={isLow ? 'text-red-500' : 'text-blue-500'}>
            {icon}
          </div>
        </div>
      </div>
      <div className={`text-2xl font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
        {formatKg(value)}
      </div>
      {isLow && (
        <p className="text-[10px] text-red-600 mt-2 font-black uppercase tracking-tighter">ESTOQUE CRÍTICO</p>
      )}
    </div>
  );
};

export default StockCard;
