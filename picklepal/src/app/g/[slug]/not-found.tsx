import Link from "next/link";

export default function GroupNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-primary">Group not found</h1>
      <p className="text-text-secondary mt-2 max-w-sm">
        The group you&apos;re looking for doesn&apos;t exist or may have been
        removed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-court-green px-4 py-2.5 text-sm font-medium text-text-inverse transition-colors hover:bg-court-green-dark"
      >
        Go home
      </Link>
    </div>
  );
}
