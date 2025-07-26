import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  UserPlus, 
  Stethoscope, 
  Monitor, 
  Menu, 
  X,
  ArrowLeft
} from "lucide-react";

// Navigation component that adapts to different contexts in the app
// Can show as full navbar, minimal overlay, or floating bottom bar
interface NavigationProps {
  variant?: 'full' | 'minimal' | 'floating';
  showBackButton?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  variant = 'full', 
  showBackButton = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Track mobile menu state - helps with responsive design
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define all the main navigation routes for the medical queue system
  // Each has an icon and description to help users understand what each section does
  const navigationItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: Home, 
      description: 'Main landing page' 
    },
    { 
      path: '/patient', 
      label: 'Register Patient', 
      icon: UserPlus, 
      description: 'Register for queue' 
    },
    { 
      path: '/doctor', 
      label: 'Doctor Login', 
      icon: Stethoscope, 
      description: 'Healthcare provider access' 
    },
    { 
      path: '/display', 
      label: 'Queue Display', 
      icon: Monitor, 
      description: 'View current queue status' 
    },
  ];

  const handleNavigate = (path: string) => {
    // Navigate to the selected page and close mobile menu if it was open
    // This ensures smooth UX on mobile devices
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isCurrentPath = (path: string) => {
    // Helper to highlight the current page in navigation
    // Makes it clear to users where they are in the app
    return location.pathname === path;
  };

  // MINIMAL VARIANT - floating navigation overlay
  // Perfect for forms and focused tasks where we don't want to distract users
  // but still need quick access to other sections
  if (variant === 'minimal') {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              {/* Back button is useful during multi-step processes */}
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {/* Mobile menu toggle - hamburger icon that everyone recognizes */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              {/* Desktop navigation - hidden on mobile to save space */}
              <div className="hidden lg:flex items-center gap-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isCurrentPath(item.path) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigate(item.path)}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
            {/* Mobile dropdown menu - shows when hamburger is clicked */}
            {isMobileMenuOpen && (
              <div className="mt-2 pt-2 border-t lg:hidden">
                <div className="flex flex-col gap-1">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isCurrentPath(item.path) ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleNavigate(item.path)}
                      className="flex items-center gap-2 justify-start"
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{item.label}</div>
                        {/* Show descriptions on mobile to help users understand each option */}
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // FLOATING VARIANT - bottom navigation bar
  // Great for mobile-first experiences, keeps navigation always accessible
  // without taking up precious screen real estate at the top
  if (variant === 'floating') {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {/* Floating nav shows icons and labels in a compact vertical layout */}
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isCurrentPath(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigate(item.path)}
                  className="flex flex-col items-center gap-1 h-auto py-2 px-3"
                  title={item.description} // Tooltip shows on hover
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FULL VARIANT - traditional top navigation bar
  // The classic approach that works great for desktop and provides
  // a professional, familiar experience that users expect
  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo section - clicking it always takes you home */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigate('/')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              MedQueue
            </button>
          </div>

          {/* Desktop navigation - clean horizontal layout */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={isCurrentPath(item.path) ? "default" : "ghost"}
                onClick={() => handleNavigate(item.path)}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Mobile hamburger menu button - only shows on small screens */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile slide-down menu - appears below the main nav bar */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isCurrentPath(item.path) ? "default" : "ghost"}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 justify-start py-3"
                >
                  <item.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    {/* Mobile descriptions help users understand what each section does */}
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
