import { MediaList } from '@/components/MediaList';

export default function SeriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Series</h2>
        <p className="text-muted-foreground">Your series collection.</p>
      </div>
      <MediaList type="SERIES" />
    </div>
  );
}
