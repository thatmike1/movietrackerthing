'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getImageUrl } from '@/lib/tmdb';
import { Loader2, Shuffle, Film, Tv, Sparkles, Plus } from 'lucide-react';
import { MediaDetailDialog } from '@/components/MediaDetailDialog';

export default function RecommendationsPage() {
  const { mode } = useAppStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<'MOVIE' | 'SERIES' | null>(null);
  const queryClient = useQueryClient();

  // Fetch only UNSEEN items for the current mode
  const { data: items, isLoading } = useQuery({
    queryKey: ['recommendations', mode, filterType],
    queryFn: async () => {
      let url = `/api/media?watched=false&userMode=${mode}`;
      if (filterType) url += `&type=${filterType}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Fetch DISCOVERY items
  const { data: discoveryItems, isLoading: isDiscoveryLoading } = useQuery({
    queryKey: ['discovery', mode, filterType],
    queryFn: async () => {
      let url = `/api/recommendations/discover?userMode=${mode}`;
      if (filterType) url += `&type=${filterType === 'SERIES' ? 'tv' : 'movie'}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch discovery');
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: any) => {
       const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          type: item.mediaType === 'MOVIE' ? 'movie' : 'tv',
          title: item.title,
          overview: item.overview,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          releaseDate: item.releaseDate,
          genres: [], // We don't have genres here easily without another call, or we can pass empty
          userMode: mode,
          // No rating, just adding to watchlist
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
      // alert('Added to library!');
    }
  });

  const pickRandom = () => {
    if (items && items.length > 0) {
      const random = items[Math.floor(Math.random() * items.length)];
      setSelectedItem(random);
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">For You</h2>
          <p className="text-muted-foreground">
            Recommendations based on what you haven't seen yet ({mode === 'TOGETHER' ? 'together' : 'personally'}).
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            variant={filterType === null ? 'default' : 'outline'}
            onClick={() => setFilterType(null)}
          >
            All
          </Button>
          <Button 
            variant={filterType === 'MOVIE' ? 'default' : 'outline'}
            onClick={() => setFilterType('MOVIE')}
          >
            <Film className="mr-2 h-4 w-4" /> Movies
          </Button>
          <Button 
            variant={filterType === 'SERIES' ? 'default' : 'outline'}
            onClick={() => setFilterType('SERIES')}
          >
            <Tv className="mr-2 h-4 w-4" /> Series
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card/50 border-dashed">
          <Button size="lg" className="text-lg px-8 py-6" onClick={pickRandom} disabled={!items || items.length === 0}>
            <Shuffle className="mr-2 h-5 w-5" />
            Pick Something for Me
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            {items ? `${items.length} unseen items available` : 'Loading...'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <Sparkles className="text-yellow-500 h-6 w-6" />
           <h2 className="text-2xl font-bold tracking-tight">Discover New</h2>
        </div>
        <p className="text-muted-foreground">
          Top picks from TMDB based on your favorite genres.
        </p>
        
        {isDiscoveryLoading ? (
           <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {discoveryItems?.map((item: any) => (
              <Card key={item.id} className="overflow-hidden group relative">
                <div className="aspect-[2/3] relative">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Button size="sm" onClick={() => addMutation.mutate(item)} disabled={addMutation.isPending}>
                        <Plus className="mr-2 h-4 w-4" /> Add to Watchlist
                     </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold truncate">{item.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <MediaDetailDialog 
          item={selectedItem} 
          open={!!selectedItem} 
          onOpenChange={(open) => !open && setSelectedItem(null)} 
        />
      )}
    </div>
  );
}
