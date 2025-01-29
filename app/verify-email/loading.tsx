import Alert from "../_components/ui/alert";

// app/verify-email/loading.tsx
export default function Loading() {
  return (
    <Alert type="info" message="Verifying your email..." isLoading={true} />
  );
}
