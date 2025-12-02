export interface PackageData {
  name: string;
  version: string;
  sizeMB: number; // Estimated or actual size in MB
  installDate: string; // ISO Date string
  description?: string;
  category?: 'Data Science' | 'Web' | 'Utility' | 'System' | 'AI/ML' | 'Other';
}

export interface AnalysisResult {
  isSafeToUninstall: boolean;
  reasoning: string;
  dependents: string[];
}

export enum SortOption {
  NAME = 'NAME',
  SIZE_DESC = 'SIZE_DESC',
  DATE_DESC = 'DATE_DESC',
}
