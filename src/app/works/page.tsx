import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PageTitle } from "@/components/ui/PageTitle";

export default function WorksPage() {
  return (
    <>
      <Breadcrumb
        segments={[
          { label: "หน้าหลัก", href: "/" },
          { label: "ผลงาน" },
        ]}
      />
      <main className="flex min-h-[500px] flex-col items-center justify-center px-4 py-20 text-center sm:px-8 lg:px-[60px]">
        <PageTitle>ผลงาน</PageTitle>
        <p className="mt-4 max-w-lg text-xl text-brand-muted">
          อยู่ระหว่างการพัฒนา
        </p>
      </main>
    </>
  );
}
