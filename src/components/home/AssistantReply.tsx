import { Fragment, type ReactNode } from "react";
export const assistantReplyBoxClassName =
  "rounded-xl border border-[#E5E7EB] bg-[#FAFBFD] px-5 py-4 text-[15px] leading-relaxed text-brand-dark";

function renderInline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-brand-dark">
          {part.slice(2, -2)}
        </strong>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-primary underline underline-offset-2 hover:opacity-80"
        >
          {label}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

function isOrderedItem(line: string) {
  return /^\d+\.\s/.test(line);
}

function isBulletItem(line: string) {
  return /^[-*•]\s/.test(line);
}

function isSectionHeading(line: string) {
  return /^\*\*[^*]+\*\*$/.test(line);
}

export function AssistantReply({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let blockIndex = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={blockIndex++}
          className="mb-2 mt-5 text-base font-bold text-brand-dark first:mt-0"
        >
          {renderInline(line.slice(4))}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={blockIndex++}
          className="mb-2 mt-6 border-t border-[#E5E7EB] pt-5 text-base font-bold text-brand-dark first:mt-0 first:border-t-0 first:pt-0"
        >
          {renderInline(line.slice(3))}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (isSectionHeading(line)) {
      blocks.push(
        <h3
          key={blockIndex++}
          className="mb-2 mt-6 text-base font-bold text-brand-dark first:mt-0"
        >
          {renderInline(line)}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (isOrderedItem(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && isOrderedItem(lines[index].trim())) {
        const itemLine = lines[index].trim();
        const subBullets: ReactNode[] = [];
        index += 1;

        while (index < lines.length && isBulletItem(lines[index].trim())) {
          const bulletLine = lines[index].trim();
          subBullets.push(
            <li key={index} className="leading-relaxed">
              {renderInline(bulletLine.replace(/^[-*•]\s*/, ""))}
            </li>,
          );
          index += 1;
        }

        items.push(
          <li key={`item-${blockIndex++}`} className="space-y-2.5">
            <div className="font-semibold leading-snug text-brand-dark">
              {renderInline(itemLine.replace(/^\d+\.\s*/, ""))}
            </div>
            {subBullets.length > 0 && (
              <ul className="ml-1 list-disc space-y-2 pl-5 text-[15px] text-[#4A5568] marker:text-[#9AA5BC]">
                {subBullets}
              </ul>
            )}
          </li>,
        );
      }
      blocks.push(
        <ol key={`ol-${blockIndex++}`} className="my-3 space-y-5">
          {items}
        </ol>,
      );
      continue;
    }

    if (isBulletItem(line)) {
      const items: ReactNode[] = [];
      while (index < lines.length && isBulletItem(lines[index].trim())) {
        const itemLine = lines[index].trim();
        items.push(
          <li key={index} className="leading-relaxed">
            {renderInline(itemLine.replace(/^[-*•]\s*/, ""))}
          </li>,
        );
        index += 1;
      }
      blocks.push(
        <ul
          key={`ul-${blockIndex++}`}
          className="my-2 list-disc space-y-2 pl-5 text-[15px] text-[#4A5568] marker:text-[#9AA5BC]"
        >
          {items}
        </ul>,
      );
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("#") &&
      !isSectionHeading(lines[index].trim()) &&
      !isOrderedItem(lines[index].trim()) &&
      !isBulletItem(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p
        key={`p-${blockIndex++}`}
        className="my-2 leading-relaxed text-[#4A5568] first:mt-0"
      >
        {renderInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return (
    <div className={assistantReplyBoxClassName}>
      <div className="space-y-1">{blocks}</div>
    </div>
  );
}
