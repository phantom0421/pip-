import React from 'react';
import { PackageData } from '../types';
import { Trash2, Info, Calendar, HardDrive } from 'lucide-react';

interface PackageRowProps {
  pkg: PackageData;
  onUninstall: (pkg: PackageData) => void;
  onAnalyze: (pkg: PackageData) => void;
}

const PackageRow: React.FC<PackageRowProps> = ({ pkg, onUninstall, onAnalyze }) => {
  const dateStr = new Date(pkg.installDate).toLocaleDateString();

  // Color coding for size
  const getSizeColor = (size: number) => {
    if (size > 100) return 'text-red-400';
    if (size > 50) return 'text-orange-400';
    return 'text-emerald-400';
  };

  return (
    <div className="group flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all mb-3 shadow-sm hover:shadow-md hover:border-slate-600">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white truncate">{pkg.name}</h3>
          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-700 text-slate-300">
            v{pkg.version}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            pkg.category === 'Data Science' ? 'border-purple-500/30 text-purple-300 bg-purple-500/10' :
            pkg.category === 'Web' ? 'border-blue-500/30 text-blue-300 bg-blue-500/10' :
            pkg.category === 'AI/ML' ? 'border-pink-500/30 text-pink-300 bg-pink-500/10' :
            'border-slate-500/30 text-slate-400 bg-slate-500/10'
          }`}>
            {pkg.category || 'Other'}
          </span>
        </div>
        <p className="text-sm text-slate-400 truncate mt-1">{pkg.description}</p>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Installed: {dateStr}</span>
          </div>
          <div className={`flex items-center gap-1 font-medium ${getSizeColor(pkg.sizeMB)}`}>
            <HardDrive size={12} />
            <span>{pkg.sizeMB.toFixed(1)} MB</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        <button
          onClick={() => onAnalyze(pkg)}
          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
          title="AI Analysis"
        >
          <Info size={18} />
        </button>
        <button
          onClick={() => onUninstall(pkg)}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Uninstall"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default PackageRow;
