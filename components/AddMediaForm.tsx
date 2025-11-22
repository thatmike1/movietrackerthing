'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchMulti, TMDBResult, getImageUrl } from '@/lib/tmdb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Check, Loader2, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export function AddMediaForm() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<TMDBResult | null>(null);
  const [rating, setRating] = useState<string>('');
  const [isWatched, setIsWatched] = useState(false);
  
  const { mode } = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Debounce search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    const timeoutId = setTimeout(() => setDebouncedQuery(e.target.value), 500);
    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  const addMutation = useMutation({
    mutationFn: async (item: TMDBResult) => {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: item.id,
          type: item.media_type,
          title: item.title || item.name,
          overview: item.overview,
          posterPath: item.poster_path,
          backdropPath: item.backdrop_path,
          releaseDate: item.release_date || item.first_air_date,
          genres: item.genre_ids,
          userMode: mode,
          rating: rating ? parseInt(rating) : undefined,
          // If rated, it's watched. If explicitly marked watched, it's watched.
          // The API creates a WatchEntry if userId is present.
          // We might need to pass a specific flag if we want to add to watchlist (unwatched) vs watched history.
          // Currently API creates WatchEntry immediately. Let's assume WatchEntry = "In Library".
          // We need a way to distinguish "Watchlist" vs "Watched".
          // Schema has `watchedAt`. Maybe we set it to null for watchlist?
          // Schema: watchedAt DateTime @default(now()).
          // We might need to update schema or just use the existence of Rating to imply "Watched".
          // For now, let's just send what we have.
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] });
      setSelectedItem(null);
      setRating('');
      setIsWatched(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Search movies or series..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTimeout(() => setDebouncedQuery(e.target.value), 500);
          }}
          className="max-w-md"
        />
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching...</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data?.results?.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-[2/3] relative">
              <img
                src={getImageUrl(item.poster_path)}
                alt={item.title || item.name}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-3">
              <h3 className="font-semibold truncate">{item.title || item.name}</h3>
              <p className="text-xs text-muted-foreground">
                {item.release_date || item.first_air_date || 'Unknown'}
              </p>
              <div className="flex gap-2 mt-2">
                 <Button 
                  size="sm" 
                  variant="secondary"
                  className="flex-1"
                  onClick={() => addMutation.mutate(item)}
                  disabled={addMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  List
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setSelectedItem(item)}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Rate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {selectedItem?.title || selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Add this to your watched history with a rating.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
             <div className="flex justify-center">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num.toString())}
                      className={`p-1 hover:scale-110 transition-transform ${
                        parseInt(rating) >= num ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Star className={`h-6 w-6 ${parseInt(rating) >= num ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
             </div>
             <div className="text-center font-bold text-lg">
                {rating ? `${rating}/10` : 'Select a rating'}
             </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
            <Button 
              onClick={() => selectedItem && addMutation.mutate(selectedItem)} 
              disabled={!rating || addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
