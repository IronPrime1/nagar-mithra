import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, MessageCircle, MapPin, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Issue {
  id: string;
  title: string;
  images: string[] | null;
  location_address: string | null;
  created_at: string;
  upvotes_count: number;
  comments_count: number;
  created_by: string;
  profiles: {
    display_name: string | null;
    email: string;
    role: 'user' | 'official';
  };
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  created_by: string;
  profiles: {
    display_name: string | null;
    email: string;
    role: 'user' | 'official';
  };
}

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userUpvoted, setUserUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIssue();
      fetchComments();
      checkUserUpvote();
    }
  }, [id, user]);

  const fetchIssue = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          profiles (
            display_name,
            email,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setIssue(data);
    } catch (error) {
      console.error('Error fetching issue:', error);
      toast({
        title: t('error'),
        description: 'Failed to load issue.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select(`
          *,
          profiles (
            display_name,
            email,
            role
          )
        `)
        .eq('issue_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkUserUpvote = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('issue_upvotes')
        .select('id')
        .eq('issue_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserUpvoted(!!data);
    } catch (error) {
      console.error('Error checking upvote:', error);
    }
  };

  const handleUpvote = async () => {
    if (!user || !issue) return;

    try {
      if (userUpvoted) {
        await supabase
          .from('issue_upvotes')
          .delete()
          .eq('issue_id', issue.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('issue_upvotes')
          .insert({
            issue_id: issue.id,
            user_id: user.id
          });
      }

      setUserUpvoted(!userUpvoted);
      fetchIssue(); // Refresh to get updated count
    } catch (error) {
      console.error('Error updating upvote:', error);
      toast({
        title: t('error'),
        description: 'Failed to update upvote.',
        variant: 'destructive'
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);

    try {
      const { error } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: id!,
          text: newComment.trim(),
          created_by: user.id
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      fetchIssue(); // Refresh to get updated comment count
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: t('error'),
        description: 'Failed to post comment.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('issue_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      fetchComments();
      fetchIssue(); // Refresh to get updated comment count
      toast({
        title: t('success'),
        description: 'Comment deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: t('error'),
        description: 'Failed to delete comment.',
        variant: 'destructive'
      });
    }
  };

  const getImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('issue-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const canDeleteComment = (comment: Comment) => {
    return user && (
      comment.created_by === user.id || 
      profile?.role === 'official'
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Issue not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="figtree-text container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to issues
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{issue.title}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground space-x-4">
            <span>
              by {issue.profiles.display_name || issue.profiles.email}
              {issue.profiles.role === 'official' && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Official
                </span>
              )}
            </span>
            <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
          </div>
        </CardHeader>
        <CardContent>
          {issue.images && issue.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {issue.images.map((imagePath, index) => (
                  <img
                    key={index}
                    src={getImageUrl(imagePath)}
                    alt={`Issue image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {issue.location_address && (
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{issue.location_address}</span>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <Button
              variant={userUpvoted ? "default" : "outline"}
              onClick={handleUpvote}
              className="flex items-center space-x-2"
            >
              <ArrowUp className={`w-4 h-4 ${userUpvoted ? 'fill-current' : ''}`} />
              <span>{issue.upvotes_count}</span>
            </Button>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span>{issue.comments_count} comments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('comments')}</h3>
        
        {/* Add comment form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                {submittingComment ? t('loading') : t('addComment')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No comments yet</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>
                        {comment.profiles.display_name || comment.profiles.email}
                        {comment.profiles.role === 'official' && (
                          <span className="ml-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Official
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}