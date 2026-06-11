export default function Loading() {
  return (
    <main className="flex animate-pulse flex-col items-center px-2 py-10 sm:px-4 lg:px-6 lg:py-14">
      <div className="h-10 w-40 rounded-lg bg-gray-200" />
      <div className="mt-4 h-4 w-full max-w-3xl rounded bg-gray-100" />
      <div className="mt-2 h-4 w-full max-w-2xl rounded bg-gray-100" />
      <div className="mt-8 h-[480px] w-full max-w-[1320px] rounded-2xl bg-gray-200" />
    </main>
  );
}
