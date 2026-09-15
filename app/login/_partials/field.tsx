interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

/**
 * Pembungkus input di form login: label bertanda wajib (*) sama pesan error.
 *
 * Dipake di: app/login/client.tsx → LoginClient.
 */
export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-sm font-medium text-white md:text-slate-950">
        {label}
        <span className="text-status-error">*</span>
      </div>
      {children}
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}
