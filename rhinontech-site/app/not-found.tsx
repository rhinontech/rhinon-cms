import { Aurora, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center px-5 py-24 text-center">
      <Aurora />
      <div className="relative">
        <p className="font-display text-aurora text-[120px] font-semibold leading-none sm:text-[180px]">404</p>
        <h1 className="font-display mt-4 text-[32px] font-semibold sm:text-[44px]">This page took a day off.</h1>
        <p className="mx-auto mt-4 max-w-[420px] text-[17px] leading-8 text-ink-soft">The link may be old, or the page may have moved. Let's get you back on track.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/" arrow>Back to home</Button>
          <Button href="/product" variant="ghost">See products</Button>
        </div>
      </div>
    </section>
  );
}
