import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.language || 'en');
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { error } = await updateProfile({ language: selectedLanguage });
      
      if (error) throw error;
      
      toast({
        title: t('success'),
        description: 'Settings saved successfully!'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('error'),
        description: 'Failed to save settings.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="figtree-text container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="language">{t('language')}</Label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {profile && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Profile Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role === 'user' ? t('citizen') : t('official')}</p>
                <p><strong>Display Name:</strong> {profile.display_name || 'Not set'}</p>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? t('loading') : t('save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}