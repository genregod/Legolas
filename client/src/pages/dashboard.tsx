import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, FileText, Gavel, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['/api/cases'],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading || casesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-600">Let's manage your legal matters efficiently</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <Link href="/document-upload">
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start New Case</h3>
              <p className="text-sm text-gray-600">Upload a legal document to begin</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Deadlines</h3>
              <p className="text-sm text-gray-600">
                {cases.filter((c: any) => c.responseDeadline && new Date(c.responseDeadline) > new Date()).length} deadlines in the next 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Library</h3>
              <p className="text-sm text-gray-600">Access all your documents</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {cases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gavel className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases yet</h3>
                <p className="text-gray-600 mb-6">Start by uploading your first legal document</p>
                <Link href="/document-upload">
                  <Button>
                    Upload Document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((case_item: any) => (
                  <Link key={case_item.id} href={`/case/${case_item.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{case_item.title}</h4>
                            <p className="text-sm text-gray-600">{case_item.court}</p>
                            <p className="text-xs text-gray-500">Case #{case_item.caseNumber}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{case_item.status}</div>
                            {case_item.responseDeadline && (
                              <div className="text-xs text-gray-500">
                                Deadline: {new Date(case_item.responseDeadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
