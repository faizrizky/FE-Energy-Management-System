const HERO_IMAGE = '/login-hero.webp';

export function LoginHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 md:hidden">
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-[rgba(4,47,44,0.85)]" />
    </div>
  );
}

export function LoginHeroPanel() {
  return (
    <section
      className="
        relative hidden min-h-screen shrink-0 overflow-hidden bg-[#042f2c]
        md:flex md:w-1/2 md:flex-col md:justify-between md:p-8
        xl:w-[56.25%] xl:p-16
      "
    >
      <div className="pointer-events-none absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(4,47,44,0.85)]" />
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg border border-black bg-emerald-500 p-2">
          <ZapIcon />
        </div>
        <p className="font-display text-2xl font-semibold leading-8 text-emerald-500">
          EMS
        </p>
      </div>

      <div className="relative flex w-full flex-col gap-4 md:max-w-[360px] xl:max-w-[620px]">
        <h1
          className="
            font-display text-[32px] font-bold leading-[40px] tracking-[-0.8px] text-white
            xl:text-[40px] xl:leading-[48px] xl:tracking-[-1px]
          "
        >
          Smart Energy.
          <br />
          Smarter Savings.
        </h1>
        <p className="text-sm leading-5 text-emerald-200 md:max-w-[350px] xl:max-w-[620px]">
          Monitor real-time demand, automate critical schedules, and drive down
          operational waste across your entire facility footprint with
          intelligent gateway telemetry.
        </p>
      </div>

      <p className="relative text-xs leading-[18px] text-emerald-200">
        EMS Enterprise v0.1
      </p>
    </section>
  );
}

function ZapIcon() {
  return (
    <svg
      className="size-4 text-white"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
