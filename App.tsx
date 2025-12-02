import React, { useState, useEffect } from 'react';
import { PackageData, AnalysisResult, SortOption } from './types';
import { enrichPackageMetadata, analyzeUninstallRisk } from './services/geminiService';
import PackageRow from './components/PackageRow';
import StatsPanel from './components/StatsPanel';
import ImportModal from './components/ImportModal';
import { 
  Package, 
  Search, 
  Trash2, 
  RotateCcw, 
  Download, 
  Zap, 
  AlertTriangle,
  XCircle,
  Terminal,
  Filter,
  Check
} from 'lucide-react';

const DEMO_PACKAGES: PackageData[] = [
  { name: 'numpy', version: '1.26.4', sizeMB: 32.5, installDate: '2023-11-15', category: 'Data Science', description: 'Fundamental package for array computing in Python' },
  { name: 'pandas', version: '2.2.1', sizeMB: 45.2, installDate: '2024-01-10', category: 'Data Science', description: 'Powerful data structures for data analysis, time series, and statistics' },
  { name: 'fastapi', version: '0.109.2', sizeMB: 0.8, installDate: '2024-02-01', category: 'Web', description: 'Modern, high-performance web framework for building APIs' },
  { name: 'uvicorn', version: '0.27.1', sizeMB: 2.1, installDate: '2024-02-01', category: 'Web', description: 'The lightning-fast ASGI server.' },
  { name: 'torch', version: '2.2.0', sizeMB: 850.0, installDate: '2023-12-20', category: 'AI/ML', description: 'Tensors and Dynamic neural networks in Python with strong GPU acceleration' },
  { name: 'scikit-learn', version: '1.4.1', sizeMB: 28.4, installDate: '2024-01-15', category: 'AI/ML', description: 'A set of python modules for machine learning and data mining' },
  { name: 'requests', version: '2.31.0', sizeMB: 0.4, installDate: '2023-10-05', category: 'Utility', description: 'Python HTTP for Humans.' },
  { name: 'black', version: '24.2.0', sizeMB: 1.2, installDate: '2024-02-10', category: 'Utility', description: 'The uncompromising code formatter.' },
];

function App() {
  const [packages, setPackages] = useState<PackageData[]>(DEMO_PACKAGES);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.SIZE_DESC);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // UI States
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Analysis Modal State
  const [analyzingPkg, setAnalyzingPkg] = useState<PackageData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);

  // Uninstall Toast/Modal State
  const [uninstallPkg, setUninstallPkg] = useState<PackageData | null>(null);

  // Filtering & Sorting
  const filteredPackages = packages
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOption === SortOption.NAME) return a.name.localeCompare(b.name);
      if (sortOption === SortOption.SIZE_DESC) return b.sizeMB - a.sizeMB;
      if (sortOption === SortOption.DATE_DESC) return new Date(b.installDate).getTime() - new Date(a.installDate).getTime();
      return 0;
    });

  const categories = ['All', ...Array.from(new Set(packages.map(p => p.category || 'Other')))];

  const handleImport = async (rawText: string) => {
    setIsProcessing(true);
    try {
      let initialList: Partial<PackageData>[] = [];
      
      try {
        // Try parsing JSON first (pip list --format=json)
        initialList = JSON.parse(rawText);
      } catch (e) {
        // Fallback: parse plain text (assuming one package per line or simple list)
        initialList = rawText.split(/\n|,/).map(s => s.trim()).filter(Boolean).map(name => ({ name }));
      }

      // Check if we have valid data, if only names, enrich them
      const enriched = await enrichPackageMetadata(initialList);
      setPackages(enriched);
      setImportModalOpen(false);
    } catch (error) {
      alert("Failed to parse input. Ensure it is JSON or a list of names.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalysisRequest = async (pkg: PackageData) => {
    setAnalyzingPkg(pkg);
    setAnalysisResult(null);
    setIsAnalyzingRisk(true);
    
    const result = await analyzeUninstallRisk(pkg.name, packages);
    setAnalysisResult(result);
    setIsAnalyzingRisk(false);
  };

  const confirmUninstall = () => {
    if (uninstallPkg) {
      setPackages(prev => prev.filter(p => p.name !== uninstallPkg.name));
      // Copy to clipboard
      navigator.clipboard.writeText(`pip uninstall ${uninstallPkg.name} -y`);
      setUninstallPkg(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Package className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              PipMaster
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-700"
              >
                <Terminal size={16} className="text-blue-400" />
                Import pip list
              </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search packages..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="bg-slate-950 border border-slate-700 rounded-lg flex p-1">
                   <button 
                    onClick={() => setSortOption(SortOption.SIZE_DESC)}
                    className={`p-1.5 rounded ${sortOption === SortOption.SIZE_DESC ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Sort by Size"
                   >
                     <Download size={16} className="rotate-180" />
                   </button>
                   <button 
                    onClick={() => setSortOption(SortOption.NAME)}
                    className={`p-1.5 rounded ${sortOption === SortOption.NAME ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Sort by Name"
                   >
                     <Filter size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-1">
              {filteredPackages.length === 0 ? (
                 <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                   <div className="inline-block p-4 rounded-full bg-slate-800 mb-4">
                     <Search className="text-slate-500" size={32} />
                   </div>
                   <h3 className="text-lg font-medium text-slate-300">No packages found</h3>
                   <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or import a new list.</p>
                 </div>
              ) : (
                filteredPackages.map(pkg => (
                  <PackageRow 
                    key={pkg.name} 
                    pkg={pkg} 
                    onUninstall={(p) => setUninstallPkg(p)}
                    onAnalyze={handleAnalysisRequest}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <StatsPanel packages={packages} />
             
             {/* Quick Actions / Info */}
             <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-indigo-500/20 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="text-yellow-400" size={24} />
                  <h3 className="font-bold text-white">AI Assistant Active</h3>
                </div>
                <p className="text-sm text-indigo-200 mb-4 leading-relaxed">
                  Gemini is monitoring your environment. Select a package to analyze potential conflicts or get a detailed breakdown of its purpose.
                </p>
                <div className="text-xs text-indigo-400/60 font-mono">
                  Model: gemini-2.5-flash
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* Modals */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onImport={handleImport}
        isProcessing={isProcessing}
      />

      {/* Analysis Modal */}
      {analyzingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-blue-400" />
                AI Analysis: {analyzingPkg.name}
              </h3>
              <button onClick={() => setAnalyzingPkg(null)} className="text-slate-400 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {isAnalyzingRisk ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <RotateCcw className="animate-spin text-blue-500" size={32} />
                  <p className="text-sm text-slate-400">Consulting Gemini knowledge base...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-4">
                   <div className={`p-4 rounded-xl border ${analysisResult.isSafeToUninstall ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                      <div className="flex items-start gap-3">
                        {analysisResult.isSafeToUninstall ? (
                          <div className="bg-emerald-500 rounded-full p-1 mt-0.5"><Check size={12} className="text-black" /></div>
                        ) : (
                          <div className="bg-amber-500 rounded-full p-1 mt-0.5"><AlertTriangle size={12} className="text-black" /></div>
                        )}
                        <div>
                          <h4 className={`font-bold text-sm ${analysisResult.isSafeToUninstall ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {analysisResult.isSafeToUninstall ? 'Likely Safe to Uninstall' : 'Caution Recommended'}
                          </h4>
                          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                            {analysisResult.reasoning}
                          </p>
                        </div>
                      </div>
                   </div>

                   {analysisResult.dependents && analysisResult.dependents.length > 0 && (
                     <div>
                       <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Potential Dependents</h5>
                       <div className="flex flex-wrap gap-2">
                         {analysisResult.dependents.map(d => (
                           <span key={d} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                             {d}
                           </span>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Uninstall Confirmation Modal */}
      {uninstallPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl transform transition-all">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Uninstall {uninstallPkg.name}?</h3>
              <p className="text-sm text-slate-400 mb-6">
                This will simulate the uninstall and copy the CLI command to your clipboard.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setUninstallPkg(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmUninstall}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-colors font-medium text-sm"
                >
                  Confirm & Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;