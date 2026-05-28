import publishing from "@/data/publishing.json";

export default function PublishedSitePage({ params }: { params: { slug: string } }) {
  const project = publishing.projects.find((p) => p.slug === params.slug);

  if (!project) {
    return <div>Site not found</div>;
  }

  return (
    <main>
      <h1>{project.name}</h1>
      <pre>{JSON.stringify(project.generatedConfig, null, 2)}</pre>
    </main>
  );
}