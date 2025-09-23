import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IssueCard } from '@/components/IssueCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateIssueSummary } from '@/lib/gemini';

interface Issue {
  id: string;
  title: string;
  images: string[] | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
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

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const sortIssues = (issuesData: Issue[]) => {
    if (!userLocation) {
      return issuesData.sort((a, b) => b.upvotes_count - a.upvotes_count);
    }

    return issuesData.sort((a, b) => {
      const distanceA = a.location_lat && a.location_lng ? 
        calculateDistance(userLocation.lat, userLocation.lng, a.location_lat, a.location_lng) : 
        Infinity;
      const distanceB = b.location_lat && b.location_lng ? 
        calculateDistance(userLocation.lat, userLocation.lng, b.location_lat, b.location_lng) : 
        Infinity;

      const nearbyThreshold = 10; // 10km
      const aIsNearby = distanceA <= nearbyThreshold;
      const bIsNearby = distanceB <= nearbyThreshold;

      if (aIsNearby && !bIsNearby) return -1;
      if (!aIsNearby && bIsNearby) return 1;

      if (aIsNearby && bIsNearby) {
        return b.upvotes_count - a.upvotes_count;
      }

      return b.upvotes_count - a.upvotes_count;
    });
  };

  const fetchIssues = async () => {
    try {
      // First, get the current user's role if they're logged in
      let userRole = 'user';
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!profileError && profileData) {
          userRole = profileData.role || 'user';
        }
      }

      const { data: issuesData, error } = await supabase
        .from('issues')
        .select(`
          *,
          profiles (
            display_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate AI summaries for official users
      let processedIssues = issuesData || [];
      if (userRole === 'official' || userRole === 'admin') {
        // Cache summaries during this fetch to avoid regenerating the same summary
        const summaryCache: Record<string, string> = {};

        processedIssues = await Promise.all(
          processedIssues.map(async (issue: any) => {
            if ((issue as any).ai_summary) return issue;

            if (summaryCache[issue.id]) {
              return { ...issue, ai_summary: summaryCache[issue.id] };
            }

            const summary = await generateIssueSummary(issue.title, issue.location_address, issue.images || null);
            summaryCache[issue.id] = summary;
            return { ...issue, ai_summary: summary };
          })
        );
      }

      const sortedIssues = sortIssues(processedIssues);
      setIssues(sortedIssues);

      // Fetch user upvotes
      if (user) {
        const { data: upvotesData } = await supabase
          .from('issue_upvotes')
          .select('issue_id')
          .eq('user_id', user.id);

        const upvotedIds = new Set(upvotesData?.map(upvote => upvote.issue_id) || []);
        setUserUpvotes(upvotedIds);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [user, userLocation]);

  const handleIssueClick = (issueId: string) => {
    navigate(`/issue/${issueId}`);
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

  return (
    <div className="container mx-auto px-4 py-8 figtree-text">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('communityIssues')}</h1>
        <p className="text-muted-foreground">
          {t('reportAndTrackCivicIssues')}
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t('noIssuesPostedYet')}</p>
          <button
            onClick={() => navigate('/post')}
            className="text-primary hover:underline"
          >
            {t('beTheFirstToPostAnIssue')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              userUpvoted={userUpvotes.has(issue.id)}
              onUpvoteChange={fetchIssues}
              onClick={() => handleIssueClick(issue.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}