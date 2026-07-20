import Image from "next/image";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — logo-horizontal-transparent.png on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  return (
    <div
      className={
        className ??
        "relative flex h-[44px] w-[170px] items-center overflow-hidden sm:h-[48px] sm:w-[190px]"
      }
    >
      <Image
        src="/branding/logo-horizontal-transparent.png"
        alt="Auroranexis"
        width={190}
        height={48}
        priority
        className="block h-full w-full object-contain object-left opacity-100"
      />
    </div>
  );
}
