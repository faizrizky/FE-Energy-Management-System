import { ErrorState } from '@/components/shared/error-state';

export default function UnauthorizedPage() {
  return (
    <ErrorState
      title="Access Denied"
      description="You do not have permission to access this page or meeting room."
      actionLabel="Login"
      actionHref="/login"
    />
  );
}
