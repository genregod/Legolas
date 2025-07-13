import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { 
  FileText, 
  Download, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  FileDown,
  CheckCircle2,
  Clock,
  Info,
  Maximize2,
  Minimize2,
  Moon,
  Sun
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";

interface GenerationStep {
  step: string;
  description: string;
  content?: string;
  progress: number;
  timestamp: Date;
}

export default function DocumentGenerator() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [chatExpanded, setChatExpanded] = useState(true);
  const [documentContent, setDocumentContent] = useState("");
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");
  const [darkMode, setDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Get case data
  const { data: caseData } = useQuery({
    queryKey: ['/api/cases', id],
    retry: false,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user || !caseData) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/document-generation`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for document generation');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'generation-step') {
        setGenerationSteps(prev => [...prev, {
          ...data.step,
          timestamp: new Date()
        }]);
        
        if (data.step.content) {
          setDocumentContent(prev => prev + "\n\n" + data.step.content);
        }
        
        // Auto-scroll to latest update
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [user, caseData]);

  // Document generation mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setGenerationSteps([]);
      setDocumentContent("");
      
      const response = await apiRequest('POST', `/api/cases/${id}/generate-document`, {
        documentType: 'answer',
        realtime: true
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      toast({
        title: "Document generated successfully",
        description: "Your legal document is ready for download.",
      });
    },
    onError: (error) => {
      setIsGenerating(false);
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
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (format: "pdf" | "docx") => {
      const response = await apiRequest('POST', `/api/cases/${id}/export-document`, {
        format,
        content: documentContent
      });
      return response.blob();
    },
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caseData?.caseNumber}-answer.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Document exported",
        description: `Your document has been downloaded as ${format.toUpperCase()}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartGeneration = () => {
    generateMutation.mutate();
  };

  const handleExport = (format: "pdf" | "docx") => {
    exportMutation.mutate(format);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navigation />
        
        <div className="flex h-[calc(100vh-64px)]">
          {/* Chat/Progress Panel */}
          <div className={`${
            chatExpanded ? 'w-96' : 'w-12'
          } transition-all duration-300 border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col`}>
            {chatExpanded ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      AI Legal Assistant
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDarkMode}
                      >
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setChatExpanded(false)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generating {caseData.court} compliant documents
                  </p>
                </div>

                {/* Generation Progress */}
                {isGenerating && (
                  <div className="p-4 border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Generating Document...</span>
                      <span className="text-sm text-gray-500">
                        {generationSteps.length > 0 ? 
                          `${generationSteps[generationSteps.length - 1].progress}%` : 
                          '0%'
                        }
                      </span>
                    </div>
                    <Progress 
                      value={generationSteps.length > 0 ? 
                        generationSteps[generationSteps.length - 1].progress : 
                        0
                      } 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {/* Welcome Message */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">Document Generation Assistant</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            I'll guide you through creating a legally compliant Answer document for {caseData.court}. 
                            I'll explain each section as it's being drafted.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Generation Steps */}
                    {generationSteps.map((step, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-start gap-3">
                          {step.progress === 100 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 animate-pulse" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{step.step}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {step.description}
                            </p>
                            {step.content && (
                              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                                  {step.content.substring(0, 150)}...
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {step.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="p-4 border-t dark:border-gray-700">
                  {!isGenerating && generationSteps.length === 0 && (
                    <Button 
                      onClick={handleStartGeneration}
                      className="w-full"
                      disabled={generateMutation.isPending}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Start Document Generation
                    </Button>
                  )}
                  
                  {!isGenerating && generationSteps.length > 0 && (
                    <div className="space-y-2">
                      <Button 
                        onClick={handleStartGeneration}
                        variant="outline"
                        className="w-full"
                        disabled={generateMutation.isPending}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Regenerate Document
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleExport("pdf")}
                          variant="default"
                          disabled={exportMutation.isPending}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                        <Button 
                          onClick={() => handleExport("docx")}
                          variant="secondary"
                          disabled={exportMutation.isPending}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Export DOCX
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatExpanded(true)}
                  className="rounded-none h-full w-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Document Preview Area */}
          <div className="flex-1 flex flex-col">
            {/* Document Header */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Document Generator
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {caseData.title} - Case #{caseData.caseNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {caseData.court}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/case-dashboard?id=${id}`)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8">
              <div className="max-w-4xl mx-auto">
                <Card className="min-h-[800px] shadow-lg">
                  <CardContent className="p-16">
                    {documentContent ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                          {documentContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
                        <FileText className="h-16 w-16 mb-4" />
                        <p className="text-lg mb-2">No document generated yet</p>
                        <p className="text-sm">Click "Start Document Generation" to begin</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}