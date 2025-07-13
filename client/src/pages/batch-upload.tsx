import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, MessageCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  documentType?: string;
  extractedData?: any;
  error?: string;
}

interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'ai' | 'question';
  content: string;
  timestamp: Date;
  documentId?: number;
  options?: string[]; // For multiple choice questions
}

export default function BatchUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const processDocumentsMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const totalFiles = files.length;
      
      // Add initial message
      addChatMessage('system', `Starting batch processing of ${totalFiles} documents...`);

      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        if (fileData.status !== 'pending') continue;

        // Update status to uploading
        updateFileStatus(i, 'uploading', 25);
        addChatMessage('system', `Uploading ${fileData.file.name}...`);

        try {
          // Upload file
          const formData = new FormData();
          formData.append('document', fileData.file);

          const response = await apiRequest('POST', '/api/documents/batch-upload', formData);
          const result = await response.json();

          // Update status to processing
          updateFileStatus(i, 'processing', 50);
          addChatMessage('system', `Processing ${fileData.file.name}...`);

          // Simulate AI analysis and generate questions
          updateFileStatus(i, 'processing', 75, result.documentType, result.extractedData);
          
          // Generate contextual questions based on document type
          generateContextualQuestions(result);

          // Mark as completed
          updateFileStatus(i, 'completed', 100, result.documentType, result.extractedData);
          addChatMessage('ai', `✓ ${fileData.file.name} processed successfully. Document type: ${result.documentType}`);

          // Add findings
          if (result.extractedData) {
            const findings = generateFindings(result.extractedData, result.documentType);
            addChatMessage('ai', findings);
          }

        } catch (error) {
          updateFileStatus(i, 'error', 0, undefined, undefined, error.message);
          addChatMessage('system', `❌ Error processing ${fileData.file.name}: ${error.message}`);
        }
      }

      setIsProcessing(false);
      addChatMessage('ai', 'All documents have been processed. I can now help you build your case strategy based on the uploaded documents.');
    }
  });

  const updateFileStatus = (
    index: number, 
    status: UploadedFile['status'], 
    progress: number,
    documentType?: string,
    extractedData?: any,
    error?: string
  ) => {
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status,
        progress,
        documentType,
        extractedData,
        error
      };
      return updated;
    });
  };

  const addChatMessage = (type: ChatMessage['type'], content: string, options?: string[]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      options
    };
    setChatMessages(prev => [...prev, message]);
  };

  const generateContextualQuestions = (result: any) => {
    const { documentType, extractedData } = result;
    
    // Generate questions based on document type
    if (documentType === 'complaint') {
      addChatMessage('question', 'I see this is a complaint. Are you the defendant in this case?', ['Yes', 'No']);
      addChatMessage('question', `The response deadline is ${extractedData.responseDeadline}. Do you need help preparing your answer?`, ['Yes', 'No']);
    } else if (documentType === 'search_warrant') {
      addChatMessage('question', 'This is a search warrant. Was this warrant executed at your property?', ['Yes', 'No']);
      addChatMessage('question', 'Do you believe the warrant was improperly issued or executed?', ['Yes', 'No', 'Not sure']);
    } else if (documentType.includes('motion')) {
      addChatMessage('question', 'Do you need to file a response to this motion?', ['Yes', 'No', 'Not sure']);
    }
  };

  const generateFindings = (extractedData: any, documentType: string): string => {
    let findings = `**Key Findings from ${documentType.replace(/_/g, ' ')}:**\n\n`;
    
    if (extractedData.court) findings += `• Court: ${extractedData.court}\n`;
    if (extractedData.jurisdiction) findings += `• Jurisdiction: ${extractedData.jurisdiction}\n`;
    if (extractedData.venue) findings += `• Venue: ${extractedData.venue}\n`;
    if (extractedData.caseNumber) findings += `• Case Number: ${extractedData.caseNumber}\n`;
    if (extractedData.plaintiff) findings += `• Plaintiff: ${extractedData.plaintiff}\n`;
    if (extractedData.defendant) findings += `• Defendant: ${extractedData.defendant}\n`;
    if (extractedData.judge) findings += `• Judge: ${extractedData.judge}\n`;
    if (extractedData.subjectMatter) findings += `• Subject Matter: ${extractedData.subjectMatter}\n`;
    if (extractedData.responseDeadline) findings += `• **Response Deadline: ${extractedData.responseDeadline}**\n`;
    
    if (extractedData.causesOfAction?.length > 0) {
      findings += `\n**Causes of Action:**\n`;
      extractedData.causesOfAction.forEach((cause: string) => {
        findings += `• ${cause}\n`;
      });
    }

    return findings;
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    addChatMessage('user', userInput);
    setUserInput('');
    
    // Simulate AI response
    setTimeout(() => {
      addChatMessage('ai', 'I understand. Let me analyze that in the context of your uploaded documents...');
    }, 500);
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const overallProgress = files.length > 0 ? (completedCount / files.length) * 100 : 0;

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Left: Upload Area */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Document Upload</CardTitle>
              <CardDescription>
                Upload multiple legal documents for AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Click to upload or drag and drop multiple files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports all document types up to 250MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
              </div>

              {files.length > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{completedCount} of {files.length} completed</span>
                    </div>
                    <Progress value={overallProgress} />
                  </div>

                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate flex-1">{file.file.name}</span>
                              {file.documentType && (
                                <Badge variant="secondary" className="text-xs">
                                  {file.documentType.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {file.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {file.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                              <Badge variant={
                                file.status === 'completed' ? 'success' : 
                                file.status === 'error' ? 'destructive' : 
                                'secondary'
                              }>
                                {file.status}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Button 
                    onClick={() => processDocumentsMutation.mutate()}
                    disabled={isProcessing || files.length === 0}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Analyze & Upload Documents'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Chat Interface */}
        <Card className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle>AI Legal Assistant</CardTitle>
            </div>
            <CardDescription>
              Real-time analysis and questions about your documents
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea ref={chatScrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.type === 'ai'
                          ? 'bg-muted'
                          : message.type === 'question'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground text-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.options && (
                        <div className="mt-2 space-x-2">
                          {message.options.map((option, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                addChatMessage('user', option);
                              }}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask about your documents..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}