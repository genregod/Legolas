import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Edit, Download, Share, FileText, Brain, Shield, Clock, AlertCircle, BarChart, Calendar, ChevronRight } from "lucide-react";
import Navigation from "@/components/navigation";
import CountdownTimer from "@/components/countdown-timer";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function CaseDashboard() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: case_data, isLoading, error } = useQuery({
    queryKey: ['/api/cases', id],
    retry: false,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['/api/cases', id, 'documents'],
    enabled: !!case_data,
    retry: false,
  });

  const { data: allegations = [] } = useQuery({
    queryKey: ['/api/cases', id, 'allegations'],
    enabled: !!case_data,
    retry: false,
  });

  const { data: defenses = [] } = useQuery({
    queryKey: ['/api/cases', id, 'defenses'],
    enabled: !!case_data,
    retry: false,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['/api/cases', id, 'timeline'],
    enabled: !!case_data,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
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
  }, [error, toast]);

  const downloadCaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/cases/${id}/export`);
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case-${case_data?.caseNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Case exported successfully",
        description: "Your case report has been downloaded.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!case_data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Case Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300">The case you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDeadline = case_data.responseDeadline 
    ? Math.ceil((new Date(case_data.responseDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Get AI analysis from the first document (if available)
  const primaryDocument = documents.find((doc: any) => doc.documentType === 'complaint');
  const aiAnalysis = primaryDocument?.aiAnalysis;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Case Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{case_data.title}</h1>
              <p className="text-gray-600 dark:text-gray-300">{case_data.court}, Case #{case_data.caseNumber}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {case_data.caseType}
              </Badge>
              <Button variant="outline" onClick={() => downloadCaseMutation.mutate()}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Deadline Alert */}
        {daysUntilDeadline !== null && daysUntilDeadline >= 0 && (
          <Card className={`mb-8 ${
            daysUntilDeadline <= 3 ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
            daysUntilDeadline <= 7 ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' :
            'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                    daysUntilDeadline <= 3 ? 'bg-red-100 dark:bg-red-900/30' :
                    daysUntilDeadline <= 7 ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <AlertTriangle className={`h-6 w-6 ${
                      daysUntilDeadline <= 3 ? 'text-red-600 dark:text-red-400' :
                      daysUntilDeadline <= 7 ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${
                      daysUntilDeadline <= 3 ? 'text-red-700 dark:text-red-300' :
                      daysUntilDeadline <= 7 ? 'text-amber-700 dark:text-amber-300' :
                      'text-blue-700 dark:text-blue-300'
                    }`}>Response Deadline</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Answer must be filed by {new Date(case_data.responseDeadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <CountdownTimer targetDate={case_data.responseDeadline} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Risk Assessment */}
        {aiAnalysis?.riskAssessment && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Overall Risk Level</Label>
                  <div className="mt-2">
                    <Badge 
                      variant={
                        aiAnalysis.riskAssessment.overallRisk === 'high' ? 'destructive' :
                        aiAnalysis.riskAssessment.overallRisk === 'medium' ? 'secondary' :
                        'default'
                      }
                      className="text-lg px-4 py-2"
                    >
                      {aiAnalysis.riskAssessment.overallRisk.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Success Probability</Label>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <Progress value={aiAnalysis.riskAssessment.successProbability || 50} className="flex-1" />
                      <span className="text-sm font-medium">{aiAnalysis.riskAssessment.successProbability || 50}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Potential Damages</Label>
                  <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    ${(case_data.damageAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              {aiAnalysis.riskAssessment.factors && (
                <div className="mt-4">
                  <Label>Risk Factors</Label>
                  <ul className="mt-2 space-y-1">
                    {aiAnalysis.riskAssessment.factors.map((factor: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allegations">Allegations</TabsTrigger>
            <TabsTrigger value="defenses">Defenses</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Case Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Plaintiff</Label>
                        <p className="mt-1 font-medium">{case_data.plaintiff}</p>
                      </div>
                      <div>
                        <Label>Defendant</Label>
                        <p className="mt-1 font-medium">{case_data.defendant}</p>
                      </div>
                      <div>
                        <Label>Court</Label>
                        <p className="mt-1 font-medium">{case_data.court}</p>
                      </div>
                      <div>
                        <Label>Case Number</Label>
                        <p className="mt-1 font-medium">{case_data.caseNumber}</p>
                      </div>
                      <div>
                        <Label>Filing Date</Label>
                        <p className="mt-1 font-medium">
                          {case_data.filingDate ? new Date(case_data.filingDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label>Response Deadline</Label>
                        <p className="mt-1 font-medium text-red-600 dark:text-red-400">
                          {case_data.responseDeadline ? new Date(case_data.responseDeadline).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis Summary */}
                {aiAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Legal Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {aiAnalysis.summary}
                      </p>
                      {aiAnalysis.keyIssues && (
                        <div>
                          <Label>Key Issues Identified</Label>
                          <ul className="mt-2 space-y-2">
                            {aiAnalysis.keyIssues.map((issue: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href={`/case/${case_data.id}/allegations`}>
                      <Button className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Manage Allegations
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                    <Link href={`/case/${case_data.id}/affirmative-defenses`}>
                      <Button className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Affirmative Defenses
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                    <Link href={`/case/${case_data.id}/draft-answer`}>
                      <Button className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Draft Answer
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                    <Link href={`/case/${case_data.id}/filing-instructions`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Filing Instructions
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Case Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Case Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeline.map((event: any, index: number) => (
                        <div key={event.id} className="flex items-start">
                          <div className={`w-3 h-3 rounded-full mt-1.5 mr-3 ${
                            event.eventType === 'created' ? 'bg-blue-500' :
                            event.eventType === 'updated' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{event.event}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(event.eventDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Allegations Tab */}
          <TabsContent value="allegations">
            <Card>
              <CardHeader>
                <CardTitle>Allegations</CardTitle>
              </CardHeader>
              <CardContent>
                {allegations.length > 0 ? (
                  <div className="space-y-4">
                    {allegations.map((allegation: any) => (
                      <div key={allegation.id} className="border rounded-lg p-4 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">Allegation #{allegation.allegationNumber}</h4>
                          <Badge variant={allegation.isAdmitted ? 'default' : allegation.isDenied ? 'destructive' : 'secondary'}>
                            {allegation.isAdmitted ? 'Admitted' : allegation.isDenied ? 'Denied' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{allegation.allegationText}</p>
                        {allegation.response && (
                          <div className="mt-2 pt-2 border-t dark:border-gray-700">
                            <Label className="text-sm">Response</Label>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{allegation.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No allegations have been processed yet.</p>
                )}
                <div className="mt-4">
                  <Link href={`/case/${case_data.id}/allegations`}>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Manage Allegations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Defenses Tab */}
          <TabsContent value="defenses">
            <Card>
              <CardHeader>
                <CardTitle>Affirmative Defenses</CardTitle>
              </CardHeader>
              <CardContent>
                {defenses.length > 0 || (aiAnalysis?.suggestedDefenses && aiAnalysis.suggestedDefenses.length > 0) ? (
                  <div className="space-y-4">
                    {/* AI Suggested Defenses */}
                    {aiAnalysis?.suggestedDefenses && aiAnalysis.suggestedDefenses.map((defense: any, index: number) => (
                      <div key={`suggested-${index}`} className="border rounded-lg p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-medium">{defense.defenseTitle}</h4>
                          </div>
                          <Badge 
                            variant={defense.strength === 'high' ? 'default' : defense.strength === 'medium' ? 'secondary' : 'outline'}
                          >
                            {defense.strength} strength
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{defense.defenseDescription}</p>
                        <p className="text-xs text-gray-500">Legal Basis: {defense.legalBasis}</p>
                        <Badge variant="outline" className="mt-2 text-xs">AI Suggested</Badge>
                      </div>
                    ))}
                    
                    {/* User Added Defenses */}
                    {defenses.map((defense: any) => (
                      <div key={defense.id} className="border rounded-lg p-4 dark:border-gray-700">
                        <h4 className="font-medium mb-2">{defense.defenseTitle}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{defense.defenseDescription}</p>
                        {defense.legalBasis && (
                          <p className="text-xs text-gray-500 mt-2">Legal Basis: {defense.legalBasis}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No affirmative defenses have been added yet.</p>
                )}
                <div className="mt-4">
                  <Link href={`/case/${case_data.id}/affirmative-defenses`}>
                    <Button>
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Defenses
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Case Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="border rounded-lg p-4 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <h4 className="font-medium">{doc.fileName}</h4>
                              <p className="text-sm text-gray-500">
                                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {doc.documentType}
                              </Badge>
                            </div>
                          </div>
                          <Link href={`/document-preview?id=${doc.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
                )}
                <div className="mt-4">
                  <Link href="/document-upload">
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}