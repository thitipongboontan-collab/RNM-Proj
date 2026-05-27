import Image from "next/image";

type AiAssistantIconProps = {
  className?: string;
  iconClassName?: string;
  sparkleClassName?: string;
  white?: boolean;
};

export function AiAssistantIcon({
  className = "relative h-[48px] w-[54px] shrink-0",
  iconClassName = "absolute left-0 top-[8px] h-[40px] w-[54px] object-contain",
  sparkleClassName = "absolute left-[28.5px] top-0 h-[20px] w-[20px] object-cover",
  white = false,
}: AiAssistantIconProps) {
  const toneClass = white ? "brightness-0 invert" : "";

  return (
    <div className={className} aria-hidden>
      <Image
        src="/images/ai-assistant.svg"
        alt=""
        width={54}
        height={40}
        className={`${iconClassName} ${toneClass}`}
      />
      <Image
        src="/images/sparkle.png"
        alt=""
        width={20}
        height={20}
        className={`${sparkleClassName} ${toneClass}`}
      />
    </div>
  );
}
