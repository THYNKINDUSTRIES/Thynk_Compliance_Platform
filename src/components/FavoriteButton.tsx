import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FavoriteButtonProps {
  regulationId: string;
  commentDeadline?: string | null;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ regulationId, commentDeadline }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) checkFavoriteStatus();
  }, [user, regulationId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('instrument_id', regulationId)
      .limit(1);

    setIsFavorite(data && data.length > 0);
  };


  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('instrument_id', regulationId);

        await supabase
          .from('comment_deadline_reminders')
          .delete()
          .eq('user_id', user.id)
          .eq('instrument_id', regulationId);

        setIsFavorite(false);
        toast({ title: 'Removed from favorites' });
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, instrument_id: regulationId });

        if (commentDeadline) {
          const deadline = new Date(commentDeadline);
          if (deadline > new Date()) {
            await supabase
              .from('comment_deadline_reminders')
              .insert({
                user_id: user.id,
                instrument_id: regulationId,
                comment_deadline: commentDeadline
              });
          }
        }

        setIsFavorite(true);
        toast({ 
          title: 'Added to favorites',
          description: commentDeadline ? 'You\'ll receive deadline reminders for this regulation' : undefined
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ title: 'Error', description: 'Failed to update favorite', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFavorite}
      disabled={loading || !user}
      className="hover:bg-transparent"
    >
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
    </Button>
  );
};
