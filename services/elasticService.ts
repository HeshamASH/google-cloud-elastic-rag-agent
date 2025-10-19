// services/elasticService.ts
import { ElasticResult, Source, AppMode } from '../types';
import { getDriveData } from './googleDriveService';

// ... (Production client comment remains the same) ...

// --- MOCK DATASETS ---

const mockCodebase: ElasticResult[] = [ /* ... existing data ... */ ];
const mockResearchPapers: ElasticResult[] = [ /* ... existing data ... */ ];

const mockSupportTickets: ElasticResult[] = [
    {
        source: { fileName: 'Login Issue EMEA', path: 'Ticket #48151' },
        contentSnippet: `User: I'm unable to log in from Germany. I keep getting an "Invalid Credentials" error. Region: EMEA`,
        score: 0.92
    },
    {
        source: { fileName: 'Billing Discrepancy NA', path: 'Ticket #62342' },
        contentSnippet: `User: Hi, I was charged twice for my subscription this month in the US. My account ID is user-123. Region: NA`,
        score: 0.89
    },
    {
        source: { fileName: 'Login Issue APAC', path: 'Ticket #55198' },
        contentSnippet: `User: My team in Japan is reporting login issues. Seems to be widespread. Region: APAC`,
        score: 0.95
    }
];

const mockSalesData = [
    { region: "NA", sales: 1250000, date: "Q3 2023" },
    { region: "EMEA", sales: 750000, date: "Q3 2023" },
    { region: "APAC", sales: 700000, date: "Q3 2023" },
];


const getDatasetForMode = (mode: AppMode, customData?: ElasticResult[]): any[] => {
    switch (mode) {
        case AppMode.CODEBASE: return mockCodebase;
        case AppMode.RESEARCH: return mockResearchPapers;
        case AppMode.SUPPORT: return mockSupportTickets;
        case AppMode.GOOGLE_DRIVE: return getDriveData();
        case AppMode.CUSTOM: return customData || [];
        // The agent gets data from specific functions, not a single dataset
        case AppMode.BUSINESS_AGENT: return []; 
        default: return [];
    }
}

// New tool-specific search functions for the agent
export const searchSupportTickets = async (query: string): Promise<ElasticResult[]> => {
  console.log(`[Tool Executed: searchSupportTickets] with query: "${query}"`);
  const lowerCaseQuery = query.toLowerCase();
  return mockSupportTickets.filter(ticket => 
    ticket.contentSnippet.toLowerCase().includes(lowerCaseQuery)
  );
};

export const getSalesData = async (region?: string): Promise<any[]> => {
  console.log(`[Tool Executed: getSalesData] for region: "${region}"`);
  if (!region) return mockSalesData;
  return mockSalesData.filter(data => data.region.toLowerCase() === region.toLowerCase());
};


export const createDatasetFromFileList = (fileList: FileList): Promise<ElasticResult[]> => {
  // ... (implementation remains the same) ...
  return new Promise((resolve, reject) => {
    const results: ElasticResult[] = [];
    let filesToProcess = fileList.length;

    if (filesToProcess === 0) {
      resolve([]);
      return;
    }

    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        results.push({
          source: {
            fileName: file.name,
            path: (file as any).webkitRelativePath || file.name,
          },
          contentSnippet: content,
          score: 1.0,
        });
        filesToProcess--;
        if (filesToProcess === 0) {
          resolve(results);
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", file.name, error);
        filesToProcess--;
        if (filesToProcess === 0) {
          resolve(results); // Resolve with what we have
        }
      };
      // Only read text-based files
      if (file.type.startsWith('text/') || file.type === 'application/json' || !file.type) {
        reader.readAsText(file);
      } else {
        console.warn(`Skipping non-text file: ${file.name} (${file.type})`);
        filesToProcess--;
        if (filesToProcess === 0) {
          resolve(results);
        }
      }
    });
  });
};


// Legacy search function for non-agent modes
export const searchDocuments = (query: string, mode: AppMode, customData?: ElasticResult[]): Promise<ElasticResult[]> => {
  console.log(`[Elastic Mock] Searching for: "${query}" in ${mode}`);
  const dataset = getDatasetForMode(mode, customData);
  if (!dataset) return Promise.resolve([]);

  return new Promise(resolve => {
      const lowerCaseQuery = query.toLowerCase();
      const results = dataset.filter(doc => 
        (doc.source.fileName + ' ' + doc.contentSnippet).toLowerCase().includes(lowerCaseQuery)
      );
      resolve(results);
  });
};

export const getFileContent = (source: Source, mode: AppMode, customData?: ElasticResult[]): Promise<string | null> => {
    const dataset = getDatasetForMode(mode, customData);
    if (!dataset) return Promise.resolve(null);
    const doc = dataset.find(d => d.source.fileName === source.fileName && d.source.path === source.path);
    return Promise.resolve(doc ? doc.contentSnippet.trim() : null);
};

export const getAllFiles = (mode: AppMode, customData?: ElasticResult[]): Promise<Source[]> => {
  const dataset = getDatasetForMode(mode, customData);
  if (!dataset) return Promise.resolve([]);

  const uniqueFiles = new Map<string, Source>();
  dataset.forEach(doc => {
    const key = `${doc.source.path}/${doc.source.fileName}`;
    if (!uniqueFiles.has(key)) {
      uniqueFiles.set(key, doc.source);
    }
  });
  return Promise.resolve(Array.from(uniqueFiles.values()));
};
