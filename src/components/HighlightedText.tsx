type HighlightedTextProps = {
    text: string;
    className?: string;
};

/**
 * Component để render nội dung với từ khóa được tô sáng
 * Sử dụng dangerouslySetInnerHTML vì Elasticsearch trả về HTML với thẻ <mark>
 */
export default function HighlightedText({ text, className = "" }: HighlightedTextProps) {
    return (
        <span
            className={`highlighted-text ${className}`}
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
}
