import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Home, Plus, Settings, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

export const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-primary">
            NagarMithra
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {t('home')}
              </Link>
            </Button>

            <Button variant={isActive('/post') ? 'default' : 'ghost'} size="sm" asChild>
              <Link to="/post">
                <Plus className="w-4 h-4 mr-2" />
                {t('postIssue')}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  {profile?.display_name || profile?.email || 'User'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 space-y-2 flex flex-col">
            <Button variant={isActive('/') ? 'default' : 'ghost'} size="sm" asChild className="w-full">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Home className="w-4 h-4 mr-2" />
                {t('home')}
              </Link>
            </Button>

            <Button variant={isActive('/post') ? 'default' : 'ghost'} size="sm" asChild className="w-full">
              <Link to="/post" onClick={() => setMobileMenuOpen(false)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('postIssue')}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-left">
                  <User className="w-4 h-4 mr-2" />
                  {profile?.display_name || profile?.email || 'User'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
};
