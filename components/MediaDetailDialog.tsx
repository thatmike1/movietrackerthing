'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getImageUrl } from '@/lib/tmdb';
import { useAppStore } from '@/lib/store';
import { Star, Trash2 } from 'lucide-react';

interface MediaDetailDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaDetailDialog({ item, open, onOpenChange }: MediaDetailDialogProps) {
  const { mode } = useAppStore();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<string>(item.ratings?.find((r: any) => r.user?.name === mode)?.value?.toString() || '');
  const [review, setReview] = useState<string>(item.ratings?.find((r: any) => r.user?.name === mode)?.review || '');

  const rateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaItemId: item.id,
          userMode: mode,
          value: parseInt(rating),
          review,
        }),
      });
      if (!res.ok) throw new Error('Failed to rate');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            {item.releaseDate?.split('-')[0]} • {JSON.parse(item.genres || '[]').map((g: any) => g.name || g).join(', ')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 md:grid-cols-2">
          <div className="aspect-[2/3] relative rounded-md overflow-hidden">
            <img
              src={getImageUrl(item.posterPath)}
              alt={item.title}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Overview</h4>
              <p className="text-sm text-muted-foreground">{item.overview}</p>
            </div>

            <div className="space-y-2">
              <Label>Your Rating</Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      <span className="flex items-center">
                        {num} <Star className="h-3 w-3 ml-1 fill-current" />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Review</Label>
              <Textarea 
                placeholder="Write your thoughts..." 
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => rateMutation.mutate()} disabled={!rating || rateMutation.isPending}>
            Save Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
