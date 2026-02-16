type BoardPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { projectId } = await params;

  return (
    <main>
      <h1 className="text-2xl font-semibold">Kanban Board</h1>
      <p className="mt-2 text-sm text-foreground/70">Board view for project {projectId}.</p>
    </main>
  );
}
