'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { getImageUrl } from '@/lib/tmdb';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Check } from 'lucide-react';
import { MediaDetailDialog } from '@/components/MediaDetailDialog';

interface MediaListProps {
  type: 'MOVIE' | 'SERIES';
}

export function MediaList({ type }: MediaListProps) {
  const { mode } = useAppStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // TODO: Add filter state (All, Unseen, Watched)
  // For now, fetching all for the type.

  const { data: items, isLoading } = useQuery({
    queryKey: ['media', type, mode],
    queryFn: async () => {
      const res = await fetch(`/api/media?type=${type}&userMode=${mode}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!items || items.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">No content found. Add some!</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item: any) => {
          const isWatched = item.watchEntries.some((entry: any) => entry.user?.name === mode); 
          
          return (
            <Card 
              key={item.id} 
              className="overflow-hidden group relative cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setSelectedItem(item)}
            >
              <div className="aspect-[2/3] relative">
                <img
                  src={getImageUrl(item.posterPath)}
                  alt={item.title}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
                {isWatched && (
                  <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{item.releaseDate?.split('-')[0]}</span>
                  {/* Placeholder for rating if we had it */}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedItem && (
        <MediaDetailDialog 
          item={selectedItem} 
          open={!!selectedItem} 
          onOpenChange={(open) => !open && setSelectedItem(null)} 
        />
      )}
    </>
  );
}
