export const ragTool = {
  name: "rag-search",
  execute: async (query: string) => ({
    query,
    results: [] as string[],
  }),
};
