export function SiteFooter() {
  return (
    <footer className="border-t py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} AI Platform Engineer Academy · AI Labs.</p>
        <p>Da infraestrutura à inteligência artificial.</p>
      </div>
    </footer>
  );
}
