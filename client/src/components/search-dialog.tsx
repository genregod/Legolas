import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Search, 
  FileText, 
  Briefcase, 
  Shield, 
  FileQuestion,
  Loader2,
  ChevronRight
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  type: 'case' | 'document' | 'allegation' | 'defense';
  id: number;
  title: string;
  excerpt: string;
  relevanceScore: number;
  metadata: any;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await apiRequest('GET', `/api/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Debounced search
  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(() => {
        searchMutation.mutate(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    onOpenChange(false);
    
    switch (result.type) {
      case 'case':
        navigate(`/case/${result.id}`);
        break;
      case 'document':
        navigate(`/case/${result.metadata.caseId}/documents`);
        break;
      case 'allegation':
        navigate(`/case/${result.metadata.caseId}/allegations`);
        break;
      case 'defense':
        navigate(`/case/${result.metadata.caseId}/affirmative-defenses`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <Briefcase className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'allegation':
        return <FileQuestion className="h-4 w-4" />;
      case 'defense':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'case':
        return "default";
      case 'document':
        return "secondary";
      case 'allegation':
        return "destructive";
      case 'defense':
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Legal Documents</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cases, documents, allegations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {searchMutation.isPending && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
            )}
          </div>

          {results.length > 0 && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((result) => (
                  <Card 
                    key={`${result.type}-${result.id}`}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getIcon(result.type)}
                            <h4 className="font-medium">{result.title}</h4>
                            <Badge variant={getTypeColor(result.type)}>
                              {result.type}
                            </Badge>
                            {result.relevanceScore > 0.8 && (
                              <Badge variant="default" className="bg-green-600">
                                High Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {result.excerpt}
                          </p>
                          {result.metadata && (
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              {result.metadata.caseNumber && (
                                <span>Case #{result.metadata.caseNumber}</span>
                              )}
                              {result.metadata.court && (
                                <span>{result.metadata.court}</span>
                              )}
                              {result.metadata.uploadedAt && (
                                <span>
                                  {new Date(result.metadata.uploadedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {query.length > 2 && !searchMutation.isPending && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or check your spelling</p>
            </div>
          )}

          {query.length <= 2 && query.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Type at least 3 characters to search</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}