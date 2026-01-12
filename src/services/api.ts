const BASE_URL = (import.meta.env.VITE_ELASTIC_API || "http://localhost:9200").replace(/\/$/, ""); // Link kết nối API Elasticsearch
const USERNAME = import.meta.env.VITE_ELASTIC_USERNAME; // Tài khoản đăng nhập Elasticsearch
const PASSWORD = import.meta.env.VITE_ELASTIC_PASSWORD; // Mật khẩu đăng nhập Elasticsearch

const getHeaders = (contentType = "application/json") => {
    // contentType: Định dạng nội dung gửi đi (mặc định là json)
    const headers: Record<string, string> = {
        "Content-Type": contentType,
    };
    if (USERNAME && PASSWORD) {
        headers["Authorization"] = "Basic " + btoa(USERNAME + ":" + PASSWORD); // Mã hóa Base64 cho Header
    }
    return headers;
};

// Helper to handle response errors
const handleResponse = async (res: Response) => {
    // res: Đối tượng phản hồi từ hàm fetch
    if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Yêu cầu thất bại: ${res.status}`;
        try {
            const json = JSON.parse(text);
            if (json.error?.reason) {
                errorMessage = json.error.reason; // Trích xuất thông báo lỗi từ Elasticsearch
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

// Search documents with Vietnamese-optimized algorithm
// Priority: exact Vietnamese -> phrase match -> no accent -> fuzzy
export interface SearchParams {
    query?: string;    // Từ khóa tìm kiếm
    index?: string;    // Tên index muốn search
    source?: string;   // Lọc theo nguồn báo
    category?: string; // Lọc theo danh mục tin
    fromDate?: string; // Thời gian bắt đầu (YYYY-MM-DD)
    toDate?: string;   // Thời gian kết thúc (YYYY-MM-DD)
    from?: number;     // Vị trí bắt đầu lấy dữ liệu (để phân trang)
    size?: number;     // Số lượng kết quả/trang
}

// Helper to build the Vietnamese-optimized search query
const buildSearchQuery = (params: SearchParams | string) => {
    // params: Đối tượng chứa thông tin search hoặc chuỗi từ khóa đơn giản
    let query = "";
    let source = "";
    let category = "";
    let fromDate = "";
    let toDate = "";

    if (typeof params === "string") {
        query = params;
    } else {
        query = params.query || "";
        source = params.source || "";
        category = params.category || "";
        fromDate = params.fromDate || "";
        toDate = params.toDate || "";
    }

    const mustClauses: any[] = [];
    const shouldClauses: any[] = [];

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

        mustClauses.push({
            bool: {
                should: shouldClauses,
                minimum_should_match: 1
            }
        });
    } else {
        mustClauses.push({ match_all: {} });
    }

    // Add filters
    if (source) {
        mustClauses.push({ term: { source: source } });
    }
    if (category) {
        mustClauses.push({ term: { category: category } });
    }
    if (fromDate || toDate) {
        const dateRange: any = {};
        if (fromDate) dateRange.gte = fromDate;
        if (toDate) dateRange.lte = toDate;
        mustClauses.push({ range: { publish_date: dateRange } });
    }

    return {
        bool: {
            must: mustClauses
        }
    };
};

export const searchElastic = async (params: SearchParams | string) => {
    // params: Tham số search (query, filter, pagination...)
    try {
        const index = typeof params === "string" ? "news_quansu" : (params.index || "news_quansu"); // Mặc định là index 'news_quansu'
        const from = typeof params === "string" ? 0 : (params.from || 0); // Vị trí bắt đầu
        const size = typeof params === "string" ? 50 : (params.size || 50); // Số lượng kết quả

        const url = `${BASE_URL}/${index}/_search`;
        const queryBody = buildSearchQuery(params);

        const searchBody = {
            query: queryBody,
            from: from,
            size: size,
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
            },
            aggs: {
                sources: {
                    terms: { field: "source", size: 50 }
                },
                categories: {
                    terms: { field: "category", size: 50 }
                }
            }
        };

        const queryLabel = typeof params === "string" ? params : params.query || "*";
        console.time(`[Tổng cộng] API Search: ${queryLabel}`);
        const res = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(searchBody),
        });

        const data = await handleResponse(res);
        if (data.took !== undefined) {
            console.log(`[Elasticsearch] Thời gian xử lý của elastic search: ${data.took}ms`);
        }
        console.timeEnd(`[Tổng cộng] API Search: ${queryLabel}`);
        return {
            hits: data.hits?.hits || [],
            total: data.hits?.total?.value || 0,
            aggregations: data.aggregations || {}
        };
    } catch (error) {
        console.error("searchElastic error:", error);
        throw error;
    }
};

// Search with explanation (for understanding scoring)
export const searchWithExplanation = async (params: SearchParams | string, docId: string, index: string) => {
    // params: Tham số search ban đầu để tái hiện context
    // docId: ID của tài liệu cụ thể muốn giải thích
    // index: Tên index chứa tài liệu đó
    try {
        const url = `${BASE_URL}/${index}/_explain/${docId}`;
        const queryBody = buildSearchQuery(params);

        console.time(`[Tổng cộng] API Explain: ${docId}`);
        const res = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                query: queryBody,
            }),
        });

        const data = await handleResponse(res);
        if (data.took !== undefined) {
            console.log(`[Elasticsearch] Thời gian xử lý nội bộ (Explain): ${data.took}ms`);
        }
        console.timeEnd(`[Tổng cộng] API Explain: ${docId}`);
        return data;
    } catch (error) {
        console.error("searchWithExplanation error:", error);
        throw error;
    }
};

// Get all indices
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

// Count all documents across cluster or in default index
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

// Index (create/update) document
// Supports two call forms:
//  - indexDocument(index, id, doc)
//  - indexDocument(id, doc) -> uses VITE_DEFAULT_INDEX or 'documents'
export const indexDocument = async (...args: any[]) => {
    // args: Mảng linh hoạt chứa index (tùy chọn), id và nội dung document
    let index: string; // Tên index đích
    let id: string;    // ID duy nhất của tài liệu
    let doc: Record<string, any>; // Dữ liệu của tài liệu (object)

    if (args.length === 2) {
        id = args[0];
        doc = args[1];
        index = import.meta.env.VITE_DEFAULT_INDEX || "documents";
    } else {
        index = args[0];
        id = args[1];
        doc = args[2];
    }

    console.log("Indexing document:", index, id, doc);
    return true;
    /*
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
    */
};

// Delete document
export const deleteDocument = async (index: string, id: string) => {
    // index: Tên index chứa tài liệu
    // id: ID tài liệu cần xóa
    console.log("Deleting document:", index, id);
    // try {
    //     const res = await fetch(`${BASE_URL}/${index}/_doc/${id}`, {
    //         method: "DELETE",
    //         headers: getHeaders(),
    //     });
    //     await handleResponse(res);
    //     return true;
    // } catch (error) {
    //     console.error("deleteDocument error:", error);
    //     throw error;
    // }
};

// Create a new index
export const createIndex = async (
    index: string,                   // Tên index mới cần tạo
    settings?: Record<string, any>,  // Cài đặt kĩ thuật cho index (shards, phân tích từ...)
    mappings?: Record<string, any>   // Định nghĩa kiểu dữ liệu cho từng cột (field)
): Promise<boolean> => {
    console.log("Creating index:", index, settings, mappings);
    return true;
    // try {
    //     const body: Record<string, any> = {};
    //     if (settings) body.settings = settings;
    //     if (mappings) body.mappings = mappings;

    //     const res = await fetch(`${BASE_URL}/${index}`, {
    //         method: "PUT",
    //         headers: getHeaders(),
    //         body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    //     });

    //     await handleResponse(res);
    //     return true;
    // } catch (error) {
    //     console.error("createIndex error:", error);
    //     return false;
    // }
};

// Delete an index
export const deleteIndex = async (index: string): Promise<boolean> => {
    // index: Tên index muốn xóa hoàn toàn
    console.log("Deleting index:", index);
    return true;
    // try {
    //     const res = await fetch(`${BASE_URL}/${index}`, {
    //         method: "DELETE",
    //         headers: getHeaders(),
    //     });
    //     await handleResponse(res);
    //     return true;
    // } catch (error) {
    //     console.error("deleteIndex error:", error);
    //     return false;
    // }
};

// Get index details
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

// Get documents by index
export const getDocumentsByIndex = async (index: string) => {
    // index: Tên index muốn lấy danh sách tài liệu mẫu
    try {
        console.time(`[Tổng cộng] API ListDocs: ${index}`);
        const res = await fetch(`${BASE_URL}/${index}/_search`, {
            method: "POST", // search uses POST
            headers: getHeaders(),
            body: JSON.stringify({
                query: { match_all: {} },
                size: 100 // Limit to 100 docs for overview
            })
        });
        const data = await handleResponse(res);
        if (data.took !== undefined) {
            console.log(`[Elasticsearch] Thời gian xử lý nội bộ (List): ${data.took}ms`);
        }
        console.timeEnd(`[Tổng cộng] API ListDocs: ${index}`);
        return data.hits?.hits || [];
    } catch (error) {
        console.error("getDocumentsByIndex error:", error);
        throw error;
    }
};

// Bulk index documents (create/update multiple)
export const bulkIndexDocuments = async (index: string, docs: any[]) => {
    // index: Tên index đích
    // docs: Mảng chứa nhiều tài liệu (objects) để thêm cùng lúc
    console.log("Bulk indexing documents:", index, docs);
    return true;
    // try {
    //     // Transform to NDJSON format required by Elasticsearch _bulk API
    //     // { "index": { "_index": "test", "_id": "1" } }
    //     // { "field1": "value1" }
    //     const bodyLines: string[] = [];

    //     docs.forEach(doc => {
    //         // Extract ID if present, otherwise let Elastic generate it
    //         const action: any = { index: { _index: index } };
    //         if (doc.id) {
    //             action.index._id = doc.id;
    //         } else if (doc._id) {
    //             action.index._id = doc._id;
    //         }

    //         bodyLines.push(JSON.stringify(action));
    //         bodyLines.push(JSON.stringify(doc));
    //     });

    //     // NDJSON must end with a newline
    //     bodyLines.push("");
    //     const body = bodyLines.join("\n");

    //     const res = await fetch(`${BASE_URL}/_bulk`, {
    //         method: "POST",
    //         headers: getHeaders("application/x-ndjson"),
    //         body: body,
    //     });

    //     const data = await handleResponse(res);
    //     return !data.errors; // Returns true if no errors
    // } catch (error) {
    //     console.error("bulkIndexDocuments error:", error);
    //     return false;
    // }
};

