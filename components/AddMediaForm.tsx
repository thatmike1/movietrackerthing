'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchMulti, TMDBResult, getImageUrl } from '@/lib/tmdb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export function AddMediaForm() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
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
      // TODO: Get actual User ID based on mode. For now, we'll mock it or handle it in the backend if we had auth.
      // Since we don't have real auth, we'll just pass the mode as the "userId" for now to keep it simple as requested.
      // In a real app, we'd look up the User record by name (Me, Girlfriend, Together).
      
      // First, we need to ensure the User exists. 
      // For this MVP, let's assume the backend handles "finding" the user by name or we create them on init.
      // I'll update the API to handle "userName" instead of "userId" for simplicity if needed, 
      // or I'll just send a dummy ID for now and fix it in the next step.
      
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
          // sending mode as a placeholder for user identification logic
          userMode: mode, 
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] });
      // Maybe show a toast
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
            // Simple debounce implementation inline for now, or use the effect above
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
              <Button 
                size="sm" 
                className="w-full mt-2" 
                onClick={() => addMutation.mutate(item)}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Add to Watchlist
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
