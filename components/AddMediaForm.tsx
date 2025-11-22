'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Check, Loader2, Star, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getImageUrl, TMDBResult } from '@/lib/tmdb';

const GENRES = [
  { id: '28', name: 'Action' },
  { id: '12', name: 'Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '99', name: 'Documentary' },
  { id: '18', name: 'Drama' },
  { id: '10751', name: 'Family' },
  { id: '14', name: 'Fantasy' },
  { id: '36', name: 'History' },
  { id: '27', name: 'Horror' },
  { id: '10402', name: 'Music' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Science Fiction' },
  { id: '10770', name: 'TV Movie' },
  { id: '53', name: 'Thriller' },
  { id: '10752', name: 'War' },
  { id: '37', name: 'Western' },
];

export function AddMediaForm() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<TMDBResult | null>(null);
  const [rating, setRating] = useState<string>('');
  
  // Browse State
  const [browseType, setBrowseType] = useState<'movie' | 'tv'>('movie');
  const [browseGenre, setBrowseGenre] = useState<string>('all');

  const { mode } = useAppStore();
  const queryClient = useQueryClient();

  // Search Query
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['tmdb', 'search', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb?endpoint=search&query=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error('Failed to search');
      return res.json();
    },
    enabled: debouncedQuery.length > 2,
  });

  // Browse Query
  const { data: browseData, isLoading: isBrowseLoading } = useQuery({
    queryKey: ['tmdb', 'discover', browseType, browseGenre],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb?endpoint=discover&type=${browseType}&genre=${browseGenre}`);
      if (!res.ok) throw new Error('Failed to browse');
      return res.json();
    },
    enabled: debouncedQuery.length <= 2, // Only browse when not searching
  });

  const displayData = debouncedQuery.length > 2 ? searchData : browseData;
  const isLoading = debouncedQuery.length > 2 ? isSearchLoading : isBrowseLoading;

  const addMutation = useMutation({
    mutationFn: async (item: TMDBResult) => {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: item.id,
          type: item.media_type || (browseType === 'tv' ? 'tv' : 'movie'), // Fallback for discover results which might lack media_type
          title: item.title || item.name,
          overview: item.overview,
          posterPath: item.poster_path,
          backdropPath: item.backdrop_path,
          releaseDate: item.release_date || item.first_air_date,
          genres: item.genre_ids,
          voteAverage: item.vote_average,
          userMode: mode,
          rating: rating ? parseInt(rating) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] });
      setSelectedItem(null);
      setRating('');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search movies or series..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTimeout(() => setDebouncedQuery(e.target.value), 500);
          }}
          className="max-w-md"
        />

        {debouncedQuery.length <= 2 && (
          <div className="flex gap-4 items-center">
             <Tabs value={browseType} onValueChange={(v: any) => setBrowseType(v)}>
                <TabsList>
                  <TabsTrigger value="movie">Movies</TabsTrigger>
                  <TabsTrigger value="tv">Series</TabsTrigger>
                </TabsList>
             </Tabs>
             
             <Select value={browseGenre} onValueChange={setBrowseGenre}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {GENRES.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
          </div>
        )}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {displayData?.results?.map((item: any) => (
          <Card key={item.id} className="overflow-hidden bg-card neo-brutal">
            <div className="aspect-[2/3] relative overflow-hidden border-b-2 border-border">
              <img
                src={getImageUrl(item.poster_path)}
                alt={item.title || item.name}
                className="object-cover w-full h-full"
              />
              
              {item.vote_average > 0 && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 font-mono text-xs font-bold border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{item.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>
            <CardContent className="p-5">
              <h3 className="font-mono font-bold truncate text-lg uppercase tracking-tight">{item.title || item.name}</h3>
              <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted inline-block px-2 py-1 rounded-sm border border-border/20">
                {item.release_date || item.first_air_date || 'Unknown'}
              </p>
              <div className="flex gap-3 mt-5">
                 <Button 
                  size="sm" 
                  className="flex-1 h-10 font-mono font-bold bg-primary text-primary-foreground border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    addMutation.mutate(item);
                  }}
                  disabled={addMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  LIST
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="flex-1 h-10 font-mono font-bold bg-card text-foreground border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(item);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  RATE
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
