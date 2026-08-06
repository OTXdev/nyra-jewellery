import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="font-serif text-7xl text-accent">404</p>
      <h1 className="mt-4 font-serif text-3xl text-balance">This page has slipped away</h1>
      <p className="mt-3 max-w-sm text-muted-foreground text-pretty">
        The page you&apos;re looking for doesn&apos;t exist. Let&apos;s find you something beautiful instead.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-primary px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Browse jewelry
        </Link>
      </div>
    </main>
  )
}
