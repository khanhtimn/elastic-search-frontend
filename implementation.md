# Tài liệu Implementation: Cơ chế Xếp hạng và Trích đoạn trong Elasticsearch

## Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Cơ chế Xếp hạng (Ranking)](#cơ-chế-xếp-hạng-ranking)
3. [Trích đoạn và Tô sáng (Highlighting)](#trích-đoạn-và-tô-sáng-highlighting)
4. [Chi tiết Implementation](#chi-tiết-implementation)

---

## Giới thiệu

Tài liệu này mô tả các tính năng đã được implement trong ứng dụng Elasticsearch Frontend liên quan đến:
- **Cơ chế xếp hạng (Ranking)**: Hiển thị điểm số và giải thích cách Elasticsearch tính điểm cho mỗi kết quả
- **Trích đoạn (Highlighting)**: Tô sáng các từ khóa tìm kiếm trong nội dung kết quả

---

## Cơ chế Xếp hạng (Ranking)

### 1. Thuật toán BM25

Elasticsearch sử dụng thuật toán **BM25 (Best Match 25)** làm cơ chế xếp hạng mặc định. BM25 là phiên bản cải tiến của TF-IDF với các tham số điều chỉnh.

#### Công thức BM25:

```
score(D, Q) = Σ IDF(qi) × (f(qi, D) × (k1 + 1)) / (f(qi, D) + k1 × (1 - b + b × |D|/avgdl))
```

Trong đó:
- **f(qi, D)**: Tần suất xuất hiện của term qi trong document D (Term Frequency)
- **|D|**: Độ dài của document D
- **avgdl**: Độ dài trung bình của tất cả documents
- **k1**: Tham số điều chỉnh term frequency saturation (mặc định: 1.2)
- **b**: Tham số điều chỉnh document length normalization (mặc định: 0.75)

#### Thành phần IDF (Inverse Document Frequency):

```
IDF(qi) = ln(1 + (N - n(qi) + 0.5) / (n(qi) + 0.5))
```

Trong đó:
- **N**: Tổng số documents trong index
- **n(qi)**: Số documents chứa term qi

### 2. Các yếu tố ảnh hưởng đến điểm số

| Yếu tố | Mô tả | Ảnh hưởng |
|--------|-------|-----------|
| **Term Frequency (TF)** | Số lần xuất hiện từ khóa trong document | Càng cao → điểm càng cao (có saturation) |
| **Inverse Document Frequency (IDF)** | Độ hiếm của từ khóa trong toàn bộ index | Từ hiếm → điểm cao hơn |
| **Field Length** | Độ dài của field chứa từ khóa | Field ngắn → điểm cao hơn |
| **Field Boost** | Trọng số được gán cho field | Field quan trọng có boost cao hơn |
| **Coordination** | Số lượng terms trong query khớp | Nhiều terms khớp → điểm cao |

### 3. Implementation trong ứng dụng

#### API Service (`api.ts`)

```typescript
// Search với explain để lấy chi tiết scoring
export const searchWithExplanation = async (query: string, docId: string, index: string) => {
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
                    fuzziness: "AUTO"
                },
            },
        }),
    });
    return await res.json();
};
```

#### Component ScoreBadge

Hiển thị điểm số với màu gradient:
- 🟢 **Xanh lá** (≥70%): Điểm cao, liên quan mạnh
- 🟡 **Vàng** (40-69%): Điểm trung bình
- 🔴 **Đỏ** (<40%): Điểm thấp

#### Component ExplainModal

Hiển thị chi tiết cách tính điểm dạng cây (tree structure), bao gồm:
- Điểm tổng (final score)
- Chi tiết từng thành phần (TF, IDF, field length norm)
- Giải thích từng bước tính toán

---

## Trích đoạn và Tô sáng (Highlighting)

### 1. Cách hoạt động

Elasticsearch Highlighting API cho phép trả về các đoạn văn bản (fragments) chứa từ khóa được bao quanh bởi các thẻ HTML.

#### Cấu hình Highlighting:

```typescript
highlight: {
    fields: { "*": {} },           // Highlight tất cả fields
    pre_tags: ["<mark>"],          // Thẻ bắt đầu highlight
    post_tags: ["</mark>"],        // Thẻ kết thúc highlight
    fragment_size: 150,            // Kích thước mỗi đoạn trích
    number_of_fragments: 3         // Số đoạn trích tối đa
}
```

### 2. Các loại Highlighter

| Loại | Mô tả | Ưu điểm |
|------|-------|---------|
| **unified** (mặc định) | Highlighter thông minh, tự chọn chiến lược | Tốt nhất cho hầu hết use cases |
| **plain** | Sử dụng standard Lucene highlighter | Nhanh với documents nhỏ |
| **fvh** (Fast Vector Highlighter) | Yêu cầu term_vector | Hiệu quả với documents lớn |

### 3. Implementation trong ứng dụng

#### API Service

```typescript
export const searchElastic = async (query: string, index?: string) => {
    const res = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            query: { /* ... */ },
            highlight: {
                fields: { "*": {} },
                pre_tags: ["<mark>"],
                post_tags: ["</mark>"],
                fragment_size: 150,
                number_of_fragments: 3
            },
        }),
    });
    return data.hits?.hits || [];
};
```

#### Component HighlightedText

```typescript
export default function HighlightedText({ text }: { text: string }) {
    return (
        <span
            className="highlighted-text"
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
}
```

#### CSS Styling

```css
.highlighted-text mark {
    background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
    padding: 0.1em 0.2em;
    border-radius: 0.2em;
    font-weight: 600;
    color: #854d0e;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

---

## Chi tiết Implementation

### Files đã thêm/sửa đổi

| File | Loại | Mô tả |
|------|------|-------|
| `src/services/api.ts` | Modified | Thêm highlight config và hàm `searchWithExplanation` |
| `src/components/ScoreBadge.tsx` | New | Component hiển thị điểm xếp hạng |
| `src/components/HighlightedText.tsx` | New | Component render HTML highlight |
| `src/components/ExplainModal.tsx` | New | Modal giải thích chi tiết scoring |
| `src/components/ResultTable.tsx` | Modified | Tích hợp các component mới |
| `src/pages/SearchPage.tsx` | Modified | Truyền query prop cho ResultTable |
| `src/index.css` | Modified | Thêm CSS cho highlight |

### Luồng hoạt động

```
User nhập query
       ↓
SearchPage.handleSearch()
       ↓
api.searchElastic(query) ← [Với highlight config]
       ↓
Elasticsearch trả về results + highlight
       ↓
ResultTable hiển thị:
  ├── ScoreBadge (điểm số + nút Explain)
  ├── HighlightedText (đoạn trích)
  └── ExplainModal (khi click Explain)
```

### Ví dụ Response từ Elasticsearch

```json
{
    "hits": {
        "hits": [
            {
                "_index": "news",
                "_id": "doc1",
                "_score": 5.234,
                "_source": {
                    "title": "Tin tức chiến tranh Ukraine",
                    "content": "Nội dung bài viết..."
                },
                "highlight": {
                    "title": ["Tin tức <mark>chiến tranh</mark> Ukraine"],
                    "content": ["...diễn biến <mark>chiến tranh</mark> mới nhất..."]
                }
            }
        ]
    }
}
```

---

## Tham khảo

1. [Elasticsearch BM25 Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-similarity.html)
2. [Elasticsearch Highlighting](https://www.elastic.co/guide/en/elasticsearch/reference/current/highlighting.html)
3. [Explain API](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-explain.html)
