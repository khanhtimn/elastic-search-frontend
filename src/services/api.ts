const BASE_URL = (import.meta.env.VITE_ELASTIC_API || "http://localhost:9200").replace(/\/$/, "");
const USERNAME = import.meta.env.VITE_ELASTIC_USERNAME;
const PASSWORD = import.meta.env.VITE_ELASTIC_PASSWORD;

const getHeaders = (contentType = "application/json") => {
    const headers: Record<string, string> = {
        "Content-Type": contentType,
    };
    if (USERNAME && PASSWORD) {
        headers["Authorization"] = "Basic " + btoa(USERNAME + ":" + PASSWORD);
    }
    return headers;
};

// Helper to handle response errors
const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Yêu cầu thất bại: ${res.status}`;
        try {
            const json = JSON.parse(text);
            if (json.error?.reason) {
                errorMessage = json.error.reason;
            } else if (json.error) {
                errorMessage = typeof json.error === "string" ? json.error : JSON.stringify(json.error);
            }
        } catch {
            errorMessage += ` - ${text}`;
        }
        throw new Error(errorMessage);
    }
    return res.json();
};

// 1️⃣ Search documents with Vietnamese-optimized algorithm
// Priority: exact Vietnamese -> phrase match -> no accent -> fuzzy
export const searchElastic = async (query: string, index?: string) => {
    try {
        const targetIndex = index || "news_quansu";
        const url = `${BASE_URL}/${targetIndex}/_search`;

        // Build Vietnamese-optimized search query
        const shouldClauses = [];

        if (query) {
            // 1. Highest Priority: Exact Vietnamese match with accents (boost 10)
            shouldClauses.push({
                multi_match: {
                    query: query,
                    fields: ["title^5", "body"],
                    type: "best_fields",
                    operator: "or",
                    boost: 10
                }
            });

            // 2. High Priority: Phrase match with accents (boost 15)
            shouldClauses.push({
                multi_match: {
                    query: query,
                    fields: ["title^10", "body^2"],
                    type: "phrase",
                    slop: 2,
                    boost: 15
                }
            });

            // 3. Medium Priority: No-accent match (boost 7.5)
            shouldClauses.push({
                multi_match: {
                    query: query,
                    fields: ["title.no_accent^5", "body.no_accent"],
                    type: "best_fields",
                    operator: "or",
                    boost: 7.5
                }
            });

            // 4. Low Priority: Fuzzy match for typos (boost 2)
            shouldClauses.push({
                multi_match: {
                    query: query,
                    fields: ["title^5", "body"],
                    type: "best_fields",
                    fuzziness: "AUTO",
                    operator: "or",
                    boost: 2
                }
            });
        }

        const searchBody = {
            query: {
                bool: {
                    must: query ? [{
                        bool: {
                            should: shouldClauses,
                            minimum_should_match: 1
                        }
                    }] : [{ match_all: {} }]
                }
            },
            size: 50,
            sort: [
                "_score",
                { "publish_date": { order: "desc", unmapped_type: "date" } }
            ],
            highlight: {
                fields: {
                    title: {
                        pre_tags: ["<mark>"],
                        post_tags: ["</mark>"],
                        number_of_fragments: 0
                    },
                    body: {
                        pre_tags: ["<mark>"],
                        post_tags: ["</mark>"],
                        fragment_size: 150,
                        number_of_fragments: 3
                    }
                }
            }
        };

        const res = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(searchBody),
        });

        const data = await handleResponse(res);
        return data.hits?.hits || [];
    } catch (error) {
        console.error("searchElastic error:", error);
        throw error;
    }
};

// 1️⃣.1 Search with explanation (for understanding scoring)
export const searchWithExplanation = async (query: string, docId: string, index: string) => {
    try {
        const url = `${BASE_URL}/${index}/_explain/${docId}`;
        const res = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                query: {
                    multi_match: {
                        query: query,
                        fields: ["*"],
                        type: "best_fields",
                        // fuzziness: "AUTO"
                    },
                },
            }),
        });

        const data = await handleResponse(res);
        return data;
    } catch (error) {
        console.error("searchWithExplanation error:", error);
        throw error;
    }
};

// 2️⃣ Get all indices
export const getIndices = async (): Promise<string[]> => {
    try {
        const res = await fetch(`${BASE_URL}/_cat/indices?format=json`, {
            headers: getHeaders()
        });
        // _cat APIs might return 404 if no indices? Usually returns empty list.
        if (!res.ok) return [];
        const data = await res.json();
        // The _cat/indices API returns an array of objects
        return Array.isArray(data) ? data.map((idx: any) => idx.index).sort() : [];
    } catch (error) {
        console.error("getIndices error:", error);
        return [];
    }
};

// 3️⃣ Count all documents across cluster or in default index
export const countDocuments = async (): Promise<number> => {
    try {
        const res = await fetch(`${BASE_URL}/_count`, {
            method: "GET",
            headers: getHeaders(),
        });
        const data = await res.json();
        return typeof data.count === "number" ? data.count : 0;
    } catch (error) {
        console.error("countDocuments error:", error);
        return 0;
    }
};

// 4️⃣ Index (create/update) document
// Supports two call forms:
//  - indexDocument(index, id, doc)
//  - indexDocument(id, doc) -> uses VITE_DEFAULT_INDEX or 'documents'
export const indexDocument = async (...args: any[]) => {
    let index: string;
    let id: string;
    let doc: Record<string, any>;

    if (args.length === 2) {
        id = args[0];
        doc = args[1];
        index = import.meta.env.VITE_DEFAULT_INDEX || "documents";
    } else {
        index = args[0];
        id = args[1];
        doc = args[2];
    }

    try {
        const res = await fetch(`${BASE_URL}/${index}/_doc/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(doc),
        });

        await handleResponse(res);
        return true;
    } catch (error) {
        console.error("indexDocument error:", error);
        return false;
    }
};

// 5️⃣ Delete document
export const deleteDocument = async (index: string, id: string) => {
    try {
        const res = await fetch(`${BASE_URL}/${index}/_doc/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        await handleResponse(res);
        return true;
    } catch (error) {
        console.error("deleteDocument error:", error);
        throw error;
    }
};

// 6️⃣ Create a new index
export const createIndex = async (
    index: string,
    settings?: Record<string, any>,
    mappings?: Record<string, any>
): Promise<boolean> => {
    try {
        const body: Record<string, any> = {};
        if (settings) body.settings = settings;
        if (mappings) body.mappings = mappings;

        const res = await fetch(`${BASE_URL}/${index}`, {
            method: "PUT",
            headers: getHeaders(),
            body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        });

        await handleResponse(res);
        return true;
    } catch (error) {
        console.error("createIndex error:", error);
        return false;
    }
};

// 7️⃣ Delete an index
export const deleteIndex = async (index: string): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${index}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        await handleResponse(res);
        return true;
    } catch (error) {
        console.error("deleteIndex error:", error);
        return false;
    }
};

// 8️⃣ Get index details
export const getIndexDetails = async (index: string): Promise<any> => {
    try {
        const res = await fetch(`${BASE_URL}/${index}`, {
            method: "GET",
            headers: getHeaders(),
        });
        const data = await handleResponse(res);
        return data[index] || null;
    } catch (error) {
        console.error("getIndexDetails error:", error);
        return null;
    }
};

// 9️⃣ Get documents by index
export const getDocumentsByIndex = async (index: string) => {
    try {
        const res = await fetch(`${BASE_URL}/${index}/_search`, {
            method: "POST", // search uses POST
            headers: getHeaders(),
            body: JSON.stringify({
                query: { match_all: {} },
                size: 100 // Limit to 100 docs for overview
            })
        });
        const data = await handleResponse(res);
        return data.hits?.hits || [];
    } catch (error) {
        console.error("getDocumentsByIndex error:", error);
        throw error;
    }
};

// 10️⃣ Bulk index documents (create/update multiple)
export const bulkIndexDocuments = async (index: string, docs: any[]) => {
    try {
        // Transform to NDJSON format required by Elasticsearch _bulk API
        // { "index": { "_index": "test", "_id": "1" } }
        // { "field1": "value1" }
        const bodyLines: string[] = [];

        docs.forEach(doc => {
            // Extract ID if present, otherwise let Elastic generate it
            const action: any = { index: { _index: index } };
            if (doc.id) {
                action.index._id = doc.id;
            } else if (doc._id) {
                action.index._id = doc._id;
            }

            bodyLines.push(JSON.stringify(action));
            bodyLines.push(JSON.stringify(doc));
        });

        // NDJSON must end with a newline
        bodyLines.push("");
        const body = bodyLines.join("\n");

        const res = await fetch(`${BASE_URL}/_bulk`, {
            method: "POST",
            headers: getHeaders("application/x-ndjson"),
            body: body,
        });

        const data = await handleResponse(res);
        return !data.errors; // Returns true if no errors
    } catch (error) {
        console.error("bulkIndexDocuments error:", error);
        return false;
    }
};

