// services/elastic.ts
import { Client } from '@elastic/elasticsearch';

const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;

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

export const createIndex = async (client: Client, indexName: string) => {
  const indexExists = await client.indices.exists({ index: indexName });
  if (!indexExists) {
    await client.indices.create({ index: indexName });
    console.log(`Elasticsearch index "${indexName}" created.`);
  }
};

export const indexData = async (client: Client, indexName: string, data: any[]) => {
  for (const doc of data) {
    await client.index({
      index: indexName,
      document: doc,
    });
  }
  await client.indices.refresh({ index: indexName });
};

export const search = async (client: Client, indexName: string, query: string) => {
  const response = await client.search({
    index: indexName,
    body: {
      query: {
        match: {
          content: query
        }
      }
    }
  });
  return response.hits.hits.map((hit: any) => hit._source);
};
