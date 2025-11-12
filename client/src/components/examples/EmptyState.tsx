import EmptyState from "../EmptyState";

export default function EmptyStateExample() {
  return <EmptyState onAddClick={() => console.log("Add coffee clicked")} />;
}
