export type SearchMethod = "multi_match" | "boolean_and" | "boolean_or" | "query_string" | "match_phrase" | "wildcard";

export const SEARCH_METHODS: { value: SearchMethod; label: string; description: string }[] = [
    { value: "multi_match", label: "Multi Match", description: "Tìm kiếm linh hoạt trên nhiều trường" },
    { value: "boolean_and", label: "Boolean AND", description: "Tất cả từ khóa phải xuất hiện" },
    { value: "boolean_or", label: "Boolean OR", description: "Ít nhất một từ khóa xuất hiện" },
    { value: "query_string", label: "Query String", description: "Hỗ trợ cú pháp: AND, OR, NOT, \"...\"" },
    { value: "match_phrase", label: "Match Phrase", description: "Tìm chính xác cụm từ" },
    { value: "wildcard", label: "Wildcard", description: "Hỗ trợ ký tự đại diện: * và ?" },
];
