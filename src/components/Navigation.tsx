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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  if (variant === 'minimal') {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
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

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isCurrentPath(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigate(item.path)}
                  className="flex flex-col items-center gap-1 h-auto py-2 px-3"
                  title={item.description}
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

  // Full navigation bar
  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigate('/')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              MedQueue
            </button>
          </div>

          {/* Desktop Navigation */}
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
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
