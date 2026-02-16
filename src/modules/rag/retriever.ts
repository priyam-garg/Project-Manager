export async function hybridRetrieve(query: string) {
  return {
    query,
    documents: [] as string[],
  };
}
