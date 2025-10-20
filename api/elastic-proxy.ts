// api/elastic-proxy.ts
import { getClient, createIndex, indexData, search as esSearch } from '../services/elastic';
import { Client } from '@elastic/elasticsearch';
import sampleData from '../data/data.json';


const CHAT_HISTORY_INDEX = 'codemind-chat-history';
const DOCS_INDEX = 'codemind-docs';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const esClient = getClient();
        const { action, session, sessionId, query } = req.body;

        switch (action) {
            case 'initialize':
                await createIndex(esClient, CHAT_HISTORY_INDEX);
                await createIndex(esClient, DOCS_INDEX);
                return res.status(200).json({ success: true, message: 'Initialization checked.' });

            case 'indexData':
                await indexData(esClient, DOCS_INDEX, sampleData);
                return res.status(200).json({ success: true, message: 'Data indexed.' });
            
            case 'saveSession':
                await createIndex(esClient, CHAT_HISTORY_INDEX); // Ensure index exists before writing
                await esClient.index({
                    index: CHAT_HISTORY_INDEX,
                    id: session.id,
                    document: session,
                    refresh: true
                });
                return res.status(200).json({ success: true });

            case 'loadSession':
                const loadResponse = await esClient.get({ index: CHAT_HISTORY_INDEX, id: sessionId });
                return res.status(200).json({ session: loadResponse._source });

            case 'loadAllSessions':
                const searchResponse = await esClient.search({
                    index: CHAT_HISTORY_INDEX,
                    size: 100
                });
                const sessions: Record<string, any> = {};
                searchResponse.hits.hits.forEach((hit: any) => {
                    sessions[hit._source.id] = hit._source;
                });
                return res.status(200).json({ sessions });

            case 'deleteSession':
                await esClient.delete({ index: CHAT_HISTORY_INDEX, id: sessionId, refresh: true });
                return res.status(200).json({ success: true });

            case 'search':
                const searchResults = await esSearch(esClient, DOCS_INDEX, query);
                return res.status(200).json({ results: searchResults });

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
