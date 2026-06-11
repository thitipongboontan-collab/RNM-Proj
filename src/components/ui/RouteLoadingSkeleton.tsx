export function RouteLoadingSkeleton({
  titleWidth = "12rem",
  cards = 6,
}: {
  titleWidth?: string;
  cards?: number;
}) {
  return (
    <main className="flex animate-pulse flex-col items-center gap-8 px-4 pb-12 pt-6 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-8 md:px-10 lg:gap-[50px] lg:px-[60px] lg:pb-20 lg:pt-10">
      <div
        className="h-10 rounded-lg bg-gray-200"
        style={{ width: titleWidth }}
      />
      <div className="grid w-full max-w-[1320px] grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-[30px]">
        {Array.from({ length: cards }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl bg-white shadow-[0px_0px_5px_0px_rgba(0,0,0,0.12)]"
          >
            <div className="h-[265px] bg-gray-200" />
            <div className="space-y-4 px-[30px] py-8">
              <div className="h-5 w-4/5 rounded bg-gray-200" />
              <div className="h-4 w-3/5 rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
