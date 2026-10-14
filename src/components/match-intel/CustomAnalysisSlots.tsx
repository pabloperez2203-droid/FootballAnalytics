import React from 'react';

export default function CustomAnalysisSlots() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['A', 'B', 'C'].map(slot => (
         <div key={slot} className="border-2 border-dashed border-slate-700 bg-[#13181b]/50 rounded-xl h-48 flex items-center justify-center transition-colors hover:border-slate-500 hover:bg-[#1a2024]">
            <span className="text-slate-500 font-medium">Tu gráfico {slot}</span>
         </div>
      ))}
    </div>
  );
}
