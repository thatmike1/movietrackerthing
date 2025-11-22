import { AddMediaForm } from '@/components/AddMediaForm';

export default function AddPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add Content</h2>
        <p className="text-muted-foreground">Search for movies and series to add to your collection.</p>
      </div>
      <AddMediaForm />
    </div>
  );
}
