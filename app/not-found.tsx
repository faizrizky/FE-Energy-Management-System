import { ErrorState } from '@/components/shared/error-state';

export default function NotFound() {
  return (
    <ErrorState
      title="Page Not Found"
      description="The page you are looking for is not available."
      actionLabel="Refresh page"
      actionHref="/dashboard"
    />
  );
}
