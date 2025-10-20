// api/elastic-proxy.ts
import { Client } from '@elastic/elasticsearch';
import { GoogleGenerativeAI } from '@google/genai';
import { getClient, HISTORY_INDEX_NAME, RAG_INDEX_NAME } from '../services/elasticClient';

const getEmbedding = async (text: string) => {
    const ai = new GoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY as string });
    const embedding = await ai.embedText(text);
    return embedding;
};

const initializeHistoryIndex = async (esClient: Client) => {
    const indexExists = await esClient.indices.exists({ index: HISTORY_INDEX_NAME });
    if (!indexExists) {
      await esClient.indices.create({ index: HISTORY_INDEX_NAME });
      console.log(`Elasticsearch index "${HISTORY_INDEX_NAME}" created.`);
    }
};

const initializeRagIndex = async (esClient: Client) => {
    const indexExists = await esClient.indices.exists({ index: RAG_INDEX_NAME });
    if (!indexExists) {
        await esClient.indices.create({
            index: RAG_INDEX_NAME,
            mappings: {
                properties: {
                    embedding: {
                        type: 'dense_vector',
                        dims: 768,
                        index: true,
                        similarity: 'cosine'
                    }
                }
            }
        });
        console.log(`Elasticsearch index "${RAG_INDEX_NAME}" created.`);
    }
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const esClient = getClient();
        const { action, session, sessionId, query, documents } = req.body;

        switch (action) {
            case 'initialize':
                await initializeHistoryIndex(esClient);
                await initializeRagIndex(esClient);
                return res.status(200).json({ success: true, message: 'Initialization checked.' });
            
            case 'saveSession':
                await initializeHistoryIndex(esClient); // Ensure index exists before writing
                await esClient.index({
                    index: HISTORY_INDEX_NAME,
                    id: session.id,
                    document: session,
                    refresh: true
                });
                return res.status(200).json({ success: true });

            case 'loadSession':
                const loadResponse = await esClient.get({ index: HISTORY_INDEX_NAME, id: sessionId });
                return res.status(200).json({ session: loadResponse._source });

            case 'loadAllSessions':
                const searchResponse = await esClient.search({
                    index: HISTORY_INDEX_NAME,
                    size: 100
                });
                const sessions: Record<string, any> = {};
                searchResponse.hits.hits.forEach((hit: any) => {
                    sessions[hit._source.id] = hit._source;
                });
                return res.status(200).json({ sessions });

            case 'deleteSession':
                await esClient.delete({ index: HISTORY_INDEX_NAME, id: sessionId, refresh: true });
                return res.status(200).json({ success: true });

            case 'index':
                await initializeRagIndex(esClient);
                const operations = documents.flatMap((doc: any) => [{ index: { _index: RAG_INDEX_NAME } }, doc]);
                await esClient.bulk({ refresh: true, operations });
                return res.status(200).json({ success: true });

            case 'search':
                const vector = await getEmbedding(query);
                const ragSearchResponse = await esClient.search({
                    index: RAG_INDEX_NAME,
                    knn: {
                        field: 'embedding',
                        query_vector: vector,
                        k: 5,
                        num_candidates: 10,
                        filter: {
                            bool: {
                                must: [
                                    {
                                        match: {
                                            content: query,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    highlight: {
                        fields: {
                            content: {},
                        },
                    },
                });
                return res.status(200).json({ results: ragSearchResponse.hits.hits });

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
