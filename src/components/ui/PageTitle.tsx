export function PageTitle({ children }: { children: string }) {
  return (
    <h1 className="text-gradient-page-title text-[32px] font-bold tracking-[0.0156em]">
      {children}
    </h1>
  );
}
