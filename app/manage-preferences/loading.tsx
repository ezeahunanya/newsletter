import Alert from "../_components/ui/alert";

export default function Loading() {
  return (
    <Alert type="info" message="Fetching preferences..." isLoading={true} />
  );
}
