type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { projectId } = await params;

  return (
    <section className="min-h-screen p-6">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-foreground/60">Project Context</p>
        <h2 className="text-xl font-semibold">Project {projectId}</h2>
      </header>
      {children}
    </section>
  );
}
