export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Vision Finder</h1>
        <p className="text-sm opacity-60">
          Find and organize images for vision boards — entirely in your browser.
        </p>
      </header>

      {/* Import + filters */}
      <section className="flex flex-col gap-4">{/* ImageImporter, SearchBar, ColorPicker, FilterPanel */}</section>

      {/* Results */}
      <section className="flex-1">{/* ImageGrid */}</section>
    </main>
  );
}
