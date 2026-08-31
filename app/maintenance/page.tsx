import { ErrorState } from '@/components/shared/error-state';

export default function MaintenancePage() {
  return (
    <ErrorState
      title="Service Temporarily Unavailable"
      description="EMS is currently under maintenance or experiencing high traffic. Please try again in a few moments."
      actionLabel="Refresh page"
      actionHref="/maintenance"
    />
  );
}
