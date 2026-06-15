import { Suspense } from "react";
import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0px_8px_32px_rgba(77,92,173,0.12)]">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-brand-dark">Research Nexus</h1>
          <p className="mt-2 text-sm text-brand-muted">เข้าสู่ระบบหลังบ้าน</p>
        </div>

        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100" />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
