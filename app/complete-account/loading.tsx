import Alert from "../components/ui/alert";

export default function Loading() {
  return <Alert type="info" message="Validating token..." isLoading={true} />;
}
