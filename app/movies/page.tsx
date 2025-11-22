import { MediaList } from '@/components/MediaList';

export default function MoviesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Movies</h2>
        <p className="text-muted-foreground">Your movie collection.</p>
      </div>
      <MediaList type="MOVIE" />
    </div>
  );
}
