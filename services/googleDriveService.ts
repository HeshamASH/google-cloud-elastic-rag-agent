import { ElasticResult } from '../types';

// This is a mock service to simulate fetching data from Google Drive.
// In a real application, this would use the Google Drive API with user authentication (OAuth).

const mockDriveFiles: ElasticResult[] = [
  {
    source: {
      fileName: 'Project Phoenix Kickoff',
      path: 'My Drive/Meetings/Q3',
    },
    contentSnippet: `
Meeting Notes: Project Phoenix Kickoff
Date: October 26, 2023
Attendees: Alice, Bob, Charlie

Agenda:
1. Project Goals & Scope
2. Team Roles & Responsibilities
3. Timeline & Milestones

Key Decisions:
- We will use the new "Nova" design system.
- The backend will be built on a serverless architecture.
- Charlie is the main point of contact for the vendor.

Action Items:
- Alice: Finalize the project charter by EOD Friday.
- Bob: Set up the initial repository and CI/CD pipeline.
    `,
    score: 0.9,
  },
  {
    source: {
      fileName: 'Financials Q3 2023',
      path: 'My Drive/Finance/Reports',
    },
    contentSnippet: `
Q3 Revenue Projections:
| Region  | Projected Revenue | Actual Revenue |
|---------|-------------------|----------------|
| NA      | $1,200,000        | $1,250,000     |
| EMEA    | $800,000          | $750,000       |
| APAC    | $650,000          | $700,000       |

Notes:
- North America exceeded projections due to strong performance in the new product line.
- EMEA results were slightly below target due to currency fluctuations.
    `,
    score: 0.95,
  },
  {
    source: {
      fileName: 'Vendor List',
      path: 'My Drive/Operations',
    },
    contentSnippet: `
Active Vendors & Contacts:
- Design System: Nova Corp. (Contact: charlie@novacorp.example.com)
- Cloud Provider: CloudGen (Contact: support@cloudgen.example.com)
- Analytics: Data Insights LLC (Contact: info@datainsights.example.com)
    `,
    score: 0.85,
  },
];

/**
 * Returns the mock dataset for Google Drive.
 * In a real app, this function would make an API call to fetch files.
 */
export const getDriveData = (): ElasticResult[] => {
  console.log('[Google Drive Mock] Fetching drive data.');
  return mockDriveFiles;
};
