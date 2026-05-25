"use client";

export function CopyLinkButton() {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copyLink}
      className="rounded-[20px] border border-[#9F9F9F] bg-[#FAFAFA] px-5 py-[3px] text-base font-medium text-brand-dark"
      style={{
        borderRadius: 20,
        border: "1px solid #9F9F9F",
        backgroundColor: "#FAFAFA",
        padding: "3px 20px",
        fontSize: 16,
        fontWeight: 500,
        color: "#25324B",
        cursor: "pointer",
      }}
    >
      คัดลอกลิงก์
    </button>
  );
}
