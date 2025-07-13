import { Button } from "@/components/ui/button";
import { Scale, Bell, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <Scale className="h-8 w-8 text-primary mr-3" />
                <span className="text-xl font-bold text-primary">ArnieAI</span>
              </div>
            </Link>
          </div>
          
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden md:inline">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'User'}
                  </span>
                </div>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors hidden md:block">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors hidden md:block">
                Pricing
              </a>
              <a href="#about" className="text-gray-600 hover:text-primary transition-colors hidden md:block">
                About
              </a>
              <Button onClick={() => window.location.href = "/api/login"} variant="outline">
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
