import { logoutAdmin } from "@/app/admin/actions";

type AdminHeaderProps = {
  email?: string | null;
  title: string;
  description?: string;
};

export function AdminHeader({ email, title, description }: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#E5E7EF] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-dark">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-brand-muted">{description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {email ? (
          <span className="hidden text-sm text-brand-muted sm:inline">{email}</span>
        ) : null}
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="rounded-xl border border-[#D9DEE8] px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#F3F5FA]"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </header>
  );
}
