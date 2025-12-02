import { GoogleGenAI, Type } from "@google/genai";
import { PackageData, AnalysisResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Enriches a list of raw package names with estimated metadata (descriptions, categories, typical sizes)
 * Useful when the user only imports a basic list.
 */
export const enrichPackageMetadata = async (packages: Partial<PackageData>[]): Promise<PackageData[]> => {
  const ai = getClient();
  const packageNames = packages.map(p => p.name).join(', ');

  const prompt = `
    I have a list of Python packages: ${packageNames}.
    Return a JSON array where each object contains:
    - name (string)
    - description (string, max 10 words)
    - category (one of: 'Data Science', 'Web', 'Utility', 'System', 'AI/ML', 'Other')
    - typicalSizeMB (number, an estimate of installed size in MB, e.g. numpy is around 30, flask is around 1)
    
    If you don't know a package, estimate based on its name.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              typicalSizeMB: { type: Type.NUMBER },
            }
          }
        }
      }
    });

    const enrichedData = JSON.parse(response.text || "[]");
    
    // Merge AI data with existing data
    return packages.map(pkg => {
      const aiInfo = enrichedData.find((d: any) => d.name.toLowerCase() === pkg.name?.toLowerCase());
      return {
        ...pkg,
        name: pkg.name || 'Unknown',
        version: pkg.version || '0.0.0',
        installDate: pkg.installDate || new Date().toISOString(),
        sizeMB: pkg.sizeMB || aiInfo?.typicalSizeMB || 0.1,
        description: aiInfo?.description || 'No description available',
        category: aiInfo?.category || 'Other'
      };
    });

  } catch (error) {
    console.error("Gemini enrichment failed:", error);
    // Return original data with defaults if AI fails
    return packages.map(pkg => ({
      ...pkg,
      name: pkg.name || 'Unknown',
      version: pkg.version || '0.0.0',
      sizeMB: pkg.sizeMB || 1,
      installDate: pkg.installDate || new Date().toISOString(),
      category: 'Other'
    }));
  }
};

/**
 * Analyzes if a package is safe to uninstall.
 */
export const analyzeUninstallRisk = async (packageName: string, allPackages: PackageData[]): Promise<AnalysisResult> => {
  const ai = getClient();
  const contextList = allPackages.map(p => p.name).join(', ');
  
  const prompt = `
    Context: A user has these Python packages installed: [${contextList}].
    User wants to uninstall: "${packageName}".
    
    Analyze if this is safe. 
    1. Is it a core system library (like pip, setuptools)?
    2. Is it a dependency for other popular libraries in the list?
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafeToUninstall: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING },
            dependents: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      isSafeToUninstall: true,
      reasoning: "Could not verify with AI. Proceed with caution.",
      dependents: []
    };
  }
};
