import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Clock, FileText, Shield, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import FileUpload from "@/components/file-upload";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function DocumentUpload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document uploaded successfully",
        description: "AI analysis complete!",
      });
      setAnalysisData(data);
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
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/documents/${analysisData.document.id}/process`, {});
      return response.json();
    },
    onSuccess: (caseData) => {
      toast({
        title: "Case created successfully",
        description: "You can now manage your case and respond to allegations.",
      });
      navigate(`/case-dashboard?id=${caseData.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setAnalysisData(null);
  };

  const handleUpload = () => {
    if (uploadedFile) {
      uploadMutation.mutate(uploadedFile);
    }
  };

  const handleCreateCase = () => {
    createCaseMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <Navigation />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              AI-Powered Legal Document Analysis
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Upload your legal document for comprehensive AI analysis with GPT-4 technology
            </p>
          </div>

          {!analysisData ? (
            <Card className="p-4 sm:p-6 md:p-8">
              <div className="space-y-4 sm:space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  uploadedFile={uploadedFile}
                  onRemoveFile={() => setUploadedFile(null)}
                />
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadedFile || uploadMutation.isPending}
                    className="flex-1 h-12"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Upload and Analyze
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    disabled={uploadMutation.isPending}
                    className="h-12"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Document Summary */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Document Analysis Results</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-2">Case Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Case Number</dt>
                        <dd className="font-medium">{analysisData.extractedData?.caseNumber || 'Not identified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Court</dt>
                        <dd className="font-medium">{analysisData.extractedData?.court || 'Not identified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Document Type</dt>
                        <dd className="font-medium capitalize">{analysisData.extractedData?.documentType || 'Unknown'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    {/* Show different fields based on document type */}
                    {analysisData.extractedData?.documentType === 'search_warrant' || 
                     analysisData.extractedData?.documentType === 'arrest_warrant' ? (
                      <>
                        <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-2">Warrant Details</h3>
                        <dl className="space-y-2">
                          {analysisData.extractedData?.targetAddress && (
                            <div>
                              <dt className="text-sm text-gray-500">Target Address</dt>
                              <dd className="font-medium">{analysisData.extractedData.targetAddress}</dd>
                            </div>
                          )}
                          {analysisData.extractedData?.searchItems && analysisData.extractedData.searchItems.length > 0 && (
                            <div>
                              <dt className="text-sm text-gray-500">Items to Search</dt>
                              <dd className="font-medium">{analysisData.extractedData.searchItems.length} items listed</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-sm text-gray-500">Issued Date</dt>
                            <dd className="font-medium">
                              {analysisData.extractedData?.issuedDate 
                                ? new Date(analysisData.extractedData.issuedDate).toLocaleDateString()
                                : 'Not specified'}
                            </dd>
                          </div>
                        </dl>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-2">Parties</h3>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm text-gray-500">Plaintiff</dt>
                            <dd className="font-medium">{analysisData.extractedData?.plaintiff || 'Not identified'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Defendant</dt>
                            <dd className="font-medium">{analysisData.extractedData?.defendant || 'Not identified'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Response Deadline</dt>
                            <dd className="font-medium text-red-600 dark:text-red-400">
                              {analysisData.extractedData?.responseDeadline 
                                ? new Date(analysisData.extractedData.responseDeadline).toLocaleDateString()
                                : 'Not specified'}
                            </dd>
                          </div>
                        </dl>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* AI Analysis Summary */}
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  AI Legal Analysis
                </h3>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  {analysisData.analysis.summary}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {analysisData.analysis?.riskAssessment?.overallRisk && (
                    <Badge variant="outline" className="border-blue-600 text-blue-700 dark:text-blue-300">
                      Risk Level: {analysisData.analysis.riskAssessment.overallRisk}
                    </Badge>
                  )}
                  {analysisData.extractedData?.causesOfAction && (
                    <Badge variant="outline" className="border-blue-600 text-blue-700 dark:text-blue-300">
                      {analysisData.extractedData.causesOfAction.length} Causes of Action
                    </Badge>
                  )}
                  {analysisData.extractedData?.damageAmount && (
                    <Badge variant="outline" className="border-blue-600 text-blue-700 dark:text-blue-300">
                      Damages: ${analysisData.extractedData.damageAmount.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </Card>

              {/* Key Issues */}
              {analysisData.analysis?.keyIssues && analysisData.analysis.keyIssues.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Key Legal Issues Identified</h3>
                  <ul className="space-y-2">
                    {analysisData.analysis.keyIssues.map((issue: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Suggested Defenses */}
              {analysisData.analysis?.suggestedDefenses && analysisData.analysis.suggestedDefenses.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    AI-Suggested Affirmative Defenses
                  </h3>
                  <div className="space-y-3">
                    {analysisData.analysis.suggestedDefenses.map((defense: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h4 className="font-medium">{defense.defenseTitle || 'Unnamed Defense'}</h4>
                          <Badge 
                            variant={defense.strength === 'high' ? 'default' : defense.strength === 'medium' ? 'secondary' : 'outline'}
                            className="w-fit"
                          >
                            {defense.strength || 'unknown'} strength
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {defense.defenseDescription || defense.description || 'No description available'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Legal Basis: {defense.legalBasis || 'Not specified'}
                        </p>
                    </div>
                  ))}
                </div>
              </Card>
              )}

              {/* Next Steps */}
              {analysisData.analysis?.nextSteps && analysisData.analysis.nextSteps.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recommended Next Steps
                  </h3>
                  <div className="space-y-3">
                    {analysisData.analysis.nextSteps.map((step: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                        step.priority === 'high' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Clock className={`h-4 w-4 ${
                          step.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                          step.priority === 'high' ? 'text-amber-600 dark:text-amber-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{step.action}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                        {step.deadline && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Deadline: {new Date(step.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleCreateCase}
                  disabled={createCaseMutation.isPending}
                  className="flex-1"
                >
                  {createCaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Case...
                    </>
                  ) : (
                    'Create Case & Continue'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysisData(null);
                    setUploadedFile(null);
                  }}
                >
                  Upload Another Document
                </Button>
              </div>
            </div>
          )}

          {!analysisData && (
            <div className="mt-8 space-y-4">
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  AI-Powered Analysis Features
                </h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    Advanced OCR technology extracts text from scanned documents
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    GPT-4 analyzes legal content and identifies key issues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    Automatic deadline detection and response timeline creation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    AI suggests relevant affirmative defenses based on case law
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    Risk assessment and strategic recommendations
                  </li>
                </ul>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}