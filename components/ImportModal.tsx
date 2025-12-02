import React, { useState } from 'react';
import { X, Check, Loader2, Play } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rawText: string) => Promise<void>;
  isProcessing: boolean;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, isProcessing }) => {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Import Environment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-slate-400 text-sm mb-4">
            Run <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-mono">pip list --format=json</code> in your terminal and paste the output below. 
            Alternatively, just paste a list of package names.
          </p>
          
          <textarea
            className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder='[{"name": "numpy", "version": "1.26.0"}, ...]'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
             <div className="mt-1 text-blue-400"><Play size={16} /></div>
             <div className="text-xs text-blue-200">
               <strong>AI Power:</strong> PipMaster will use Gemini to estimate package sizes, categorize libraries, and identify what they do if you only provide names.
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(input)}
            disabled={!input.trim() || isProcessing}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            {isProcessing ? 'Analyzing...' : 'Import & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
