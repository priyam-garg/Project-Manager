export type ArchitectState = {
  projectId: string;
};

export async function runArchitectGraph(state: ArchitectState) {
  return {
    ...state,
    complete: false,
  };
}
