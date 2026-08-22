export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black py-8 text-sm text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Apex · AI Labs.</p>
        <p>Da infraestrutura à inteligência artificial.</p>
      </div>
    </footer>
  );
}
