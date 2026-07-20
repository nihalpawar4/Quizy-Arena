/**
 * Layout for auth routes (sign-in, sign-up).
 * No navigation chrome. Centered content with subtle branding.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {children}
      </div>

      {/* Footer branding */}
      <p className="mt-8 text-[11px] text-text-disabled">
        Quizy Arena · Play. Think. Grow.
      </p>
    </div>
  );
}
