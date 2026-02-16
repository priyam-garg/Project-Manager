type AgentPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function AgentPage({ params }: AgentPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <h1 className="text-2xl font-semibold">Senior Architect Agent</h1>
      <p className="mt-2 text-sm text-foreground/70">Agent workspace for project {projectId}.</p>
    </main>
  );
}
