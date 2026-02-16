type InsightPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function InsightPage({ params }: InsightPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <h1 className="text-2xl font-semibold">Insights Dashboard</h1>
      <p className="mt-2 text-sm text-foreground/70">Analytics view for project {projectId}.</p>
    </main>
  );
}
