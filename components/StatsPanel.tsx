import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PackageData } from '../types';

interface StatsPanelProps {
  packages: PackageData[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#64748b'];

const StatsPanel: React.FC<StatsPanelProps> = ({ packages }) => {
  // Aggregate size by category
  const data = React.useMemo(() => {
    const map = new Map<string, number>();
    packages.forEach(pkg => {
      const cat = pkg.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + pkg.sizeMB);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [packages]);

  const totalSize = packages.reduce((acc, curr) => acc + curr.sizeMB, 0);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-4">Storage Distribution</h2>
      
      <div className="flex-1 w-full min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
              formatter={(value: number) => `${value.toFixed(1)} MB`}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
           <span className="text-3xl font-bold text-white">{totalSize.toFixed(0)}</span>
           <span className="text-xs text-slate-400 uppercase tracking-wider">MB Used</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Total Packages</span>
          <span className="text-white font-medium">{packages.length}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-400">
          <span>Avg Size</span>
          <span className="text-white font-medium">{(totalSize / (packages.length || 1)).toFixed(1)} MB</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
