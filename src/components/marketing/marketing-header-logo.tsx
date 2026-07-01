type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — logo-horizontal-transparent.png on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  return (
    <div
      className={
        className ??
        "flex h-[44px] w-[170px] items-center overflow-hidden sm:h-[48px] sm:w-[190px]"
      }
    >
      <img
        src="/branding/logo-horizontal-transparent.png"
        alt="Auroranexis logo"
        className="block h-full w-full object-contain object-left opacity-100"
      />
    </div>
  );
}
