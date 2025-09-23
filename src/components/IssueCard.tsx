import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, MessageCircle, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';

interface Issue {
  id: string;
  title: string;
  images: string[] | null;
  location_address: string | null;
  created_at: string;
  upvotes_count: number;
  comments_count: number;
  created_by: string;
  ai_summary?: string;
  profiles: {
    display_name: string | null;
    email: string;
    role?: string;
  };
}

interface IssueCardProps {
  issue: Issue;
  userUpvoted: boolean;
  onUpvoteChange: () => void;
  onClick: () => void;
}

export const IssueCard = ({ issue, userUpvoted, onUpvoteChange, onClick }: IssueCardProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isUpvoting) return;

    setIsUpvoting(true);

    try {
      if (userUpvoted) {
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .eq('issue_id', issue.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({
            issue_id: issue.id,
            user_id: user.id
          });

        if (error) throw error;
      }

      onUpvoteChange();
    } catch (error) {
      console.error('Error updating upvote:', error);
      toast({
        title: t('error'),
        description: 'Failed to update upvote',
        variant: 'destructive'
      });
    } finally {
      setIsUpvoting(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('issue-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        {issue.images && issue.images.length > 0 && (
          <div className="mb-3">
            <img
              src={getImageUrl(issue.images[0])}
              alt="Issue"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {issue.title}
        </h3>
        
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">
            {issue.location_address || t('locationNotAvailable')}
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground mb-3">
          <span>{t('by')} {issue.profiles.display_name || issue.profiles.email}</span>
          <span className="mx-1">•</span>
          <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true, locale: i18n.language === 'hi' ? hi : undefined })}</span>
        </div>

        {issue.ai_summary && (
          <div className="mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSummary((s) => !s);
              }}
              aria-expanded={showSummary}
              className="flex items-center justify-between w-full text-sm text-primary"
            >
              <span className="font-semibold">Summary</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSummary ? 'rotate-180' : ''}`} />
            </button>

            <div
              className={`mt-2 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                showSummary ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <CardDescription className="text-sm">
                <p className="mt-1">{issue.ai_summary}</p>
              </CardDescription>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 px-4 pb-4">
        <div className="flex items-center space-x-4 w-full">
          <Button
            variant={userUpvoted ? "default" : "outline"}
            size="sm"
            onClick={handleUpvote}
            disabled={isUpvoting}
            className="flex items-center space-x-1"
          >
            <ArrowUp className={`w-4 h-4 ${userUpvoted ? 'fill-current' : ''}`} />
            <span>{issue.upvotes_count}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{issue.comments_count}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};