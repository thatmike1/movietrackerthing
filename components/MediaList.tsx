'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { getImageUrl } from '@/lib/tmdb';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Check, Search, Filter } from 'lucide-react';
import { MediaDetailDialog } from '@/components/MediaDetailDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MediaListProps {
  type: 'MOVIE' | 'SERIES';
}

export function MediaList({ type }: MediaListProps) {
  const { mode } = useAppStore();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WATCHED' | 'UNWATCHED'>('ALL');
  // Genre filter could be added if we parse all genres from items
  
  const { data: items, isLoading } = useQuery({
    queryKey: ['media', type, mode],
    queryFn: async () => {
      const res = await fetch(`/api/media?type=${type}&userMode=${mode}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter((item: any) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const isWatched = item.watchEntries.some((entry: any) => entry.user?.name === mode);
      
      let matchesStatus = true;
      if (statusFilter === 'WATCHED') matchesStatus = isWatched;
      if (statusFilter === 'UNWATCHED') matchesStatus = !isWatched;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter, mode]);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="WATCHED">Watched</SelectItem>
            <SelectItem value="UNWATCHED">Unwatched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">No content found matching your filters.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredItems.map((item: any) => {
            const isWatched = item.watchEntries.some((entry: any) => entry.user?.name === mode); 
            const userRating = item.ratings.find((r: any) => r.user?.name === mode);
            
            return (
              <Card 
                key={item.id} 
                className="overflow-hidden group relative cursor-pointer bg-card neo-brutal"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-[2/3] relative overflow-hidden border-b-2 border-border">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title}
                    className="object-cover w-full h-full"
                  />
                  
                  {isWatched && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 font-mono text-xs font-bold border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      WATCHED
                    </div>
                  )}
                  
                  {item.voteAverage && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 font-mono text-xs font-bold border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{item.voteAverage.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-mono font-bold truncate text-lg uppercase tracking-tight">{item.title}</h3>
                  <div className="flex items-center justify-between mt-3 font-mono text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded-sm border border-border/20">{item.releaseDate?.split('-')[0]}</span>
                    {userRating && (
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{userRating.value}/10</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
