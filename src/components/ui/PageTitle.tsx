export function PageTitle({ children }: { children: string }) {
  return (
    <h1 className="text-gradient-page-title text-2xl font-bold tracking-[0.0156em] sm:text-[32px]">
      {children}
    </h1>
  );
}
