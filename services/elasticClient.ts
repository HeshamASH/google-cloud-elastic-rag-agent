// services/elasticClient.ts
import { Client } from '@elastic/elasticsearch';

const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
export const HISTORY_INDEX_NAME = 'codemind-chat-history';
export const RAG_INDEX_NAME = 'codemind-rag-data';

let client: Client | null = null;

export const getClient = () => {
  if (!client) {
    if (!ELASTIC_CLOUD_ID || !ELASTIC_API_KEY) {
      throw new Error("Elasticsearch credentials are not configured on the server.");
    }
    client = new Client({
      cloud: { id: ELASTIC_CLOUD_ID },
      auth: { apiKey: ELASTIC_API_KEY }
    });
  }
  return client;
};
