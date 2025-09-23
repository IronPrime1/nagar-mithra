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

  const MenuLink = ({
    to,
    icon: Icon,
    label,
    onClick,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
  }) => (
    <Button
      variant={isActive(to) ? 'default' : 'ghost'}
      size="sm"
      asChild
      className="justify-start w-full md:w-auto"
      onClick={onClick}
    >
      <Link to={to}>
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </Link>
    </Button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm figtree-text">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-primary hover:text-primary/80 transition flex items-center space-x-2"
          >
            <img src="logo.png" className="w-10 h-10" />FixMyCity
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <MenuLink to="/" icon={Home} label={t('home')} />
            <MenuLink to="/post" icon={Plus} label={t('postIssue')} />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">
                    {profile?.display_name || profile?.email || 'User'}
                  </span>
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
          <div className="md:hidden mt-2 flex flex-col space-y-2 border-t border-border pt-2">
            <MenuLink
              to="/"
              icon={Home}
              label={t('home')}
              onClick={() => setMobileMenuOpen(false)}
            />
            <MenuLink
              to="/post"
              icon={Plus}
              label={t('postIssue')}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="truncate max-w-[180px]">
                      {profile?.display_name || profile?.email || 'User'}
                    </span>
                  </div>
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
