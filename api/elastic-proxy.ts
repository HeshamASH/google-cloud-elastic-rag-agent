// api/elastic-proxy.ts
import { Client } from '@elastic/elasticsearch';

const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const INDEX_NAME = 'codemind-chat-history';

let client: Client | null = null;

const getClient = () => {
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

const initializeIndex = async (esClient: Client) => {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      await esClient.indices.create({ index: INDEX_NAME });
      console.log(`Elasticsearch index "${INDEX_NAME}" created.`);
    }
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const esClient = getClient();
        const { action, session, sessionId } = req.body;

        switch (action) {
            case 'initialize':
                await initializeIndex(esClient);
                return res.status(200).json({ success: true, message: 'Initialization checked.' });
            
            case 'saveSession':
                await initializeIndex(esClient); // Ensure index exists before writing
                await esClient.index({
                    index: INDEX_NAME,
                    id: session.id,
                    document: session,
                    refresh: true
                });
                return res.status(200).json({ success: true });

            case 'loadSession':
                const loadResponse = await esClient.get({ index: INDEX_NAME, id: sessionId });
                return res.status(200).json({ session: loadResponse._source });

            case 'loadAllSessions':
                const searchResponse = await esClient.search({
                    index: INDEX_NAME,
                    size: 100
                });
                const sessions: Record<string, any> = {};
                searchResponse.hits.hits.forEach((hit: any) => {
                    sessions[hit._source.id] = hit._source;
                });
                return res.status(200).json({ sessions });

            case 'deleteSession':
                await esClient.delete({ index: INDEX_NAME, id: sessionId, refresh: true });
                return res.status(200).json({ success: true });

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error: any) {
        // Handle cases where a document is not found gracefully
        if (error.meta && error.meta.statusCode === 404) {
             if(req.body.action === 'loadAllSessions') return res.status(200).json({ sessions: {} });
             return res.status(200).json({ [req.body.action.replace('load', '').toLowerCase()]: null });
        }
        console.error('Error in Elastic proxy:', error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
