'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getImageUrl } from '@/lib/tmdb';
import { Loader2, Shuffle, Film, Tv } from 'lucide-react';
import { MediaDetailDialog } from '@/components/MediaDetailDialog';

export default function RecommendationsPage() {
  const { mode } = useAppStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<'MOVIE' | 'SERIES' | null>(null);

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

  const pickRandom = () => {
    if (items && items.length > 0) {
      const random = items[Math.floor(Math.random() * items.length)];
      setSelectedItem(random);
    }
  };

  return (
    <div className="space-y-8">
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
