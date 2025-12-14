const BASE_URL = (import.meta.env.VITE_ELASTIC_API || "http://localhost:9200").replace(/\/$/, "");

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

// 1️⃣ Search documents
export const searchElastic = async (query: string, index?: string) => {
    try {
        const url = index ? `${BASE_URL}/${index}/_search` : `${BASE_URL}/_search`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: {
                    multi_match: {
                        query: query,
                        fields: ["*"], // Search across all fields
                        type: "best_fields",
                        fuzziness: "AUTO" // Optional: handle typos
                    },
                },
            }),
        });

        const data = await handleResponse(res);
        return data.hits?.hits || [];
    } catch (error) {
        console.error("searchElastic error:", error);
        throw error; // Re-throw to show in UI
    }
};

// 2️⃣ Get all indices
export const getIndices = async (): Promise<string[]> => {
    try {
        const res = await fetch(`${BASE_URL}/_cat/indices?format=json`);
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
            headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
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
