const CHUNK_LINES = 150;
const CHUNK_OVERLAP = 20;

export type CodeChunk = {
  index: number;
  text: string;
  startLine: number;
  endLine: number;
};

/**
 * Naive line-based chunker. Each chunk is prefixed with the filepath header
 * so the LLM has context when retrieved standalone.
 */
export function chunkFileContent(filepath: string, content: string): CodeChunk[] {
  const lines = content.split('\n');
  if (lines.length === 0) return [];

  const chunks: CodeChunk[] = [];
  let chunkIndex = 0;
  let start = 0;

  while (start < lines.length) {
    const end = Math.min(start + CHUNK_LINES, lines.length);
    const slice = lines.slice(start, end);
    const body = slice.join('\n');
    const header = `// File: ${filepath} (lines ${start + 1}-${end})\n`;
    chunks.push({
      index: chunkIndex,
      text: header + body,
      startLine: start + 1,
      endLine: end,
    });
    chunkIndex++;
    if (end >= lines.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}
