import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Check, Clock, ArrowRight, X, HelpCircle } from "lucide-react";
import Navigation from "@/components/navigation";
import CountdownTimer from "@/components/countdown-timer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DraftAnswer() {
  const { id } = useParams();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<number, { response: string; notes: string }>>({});

  const { data: case_data } = useQuery({
    queryKey: ['/api/cases', id],
    retry: false,
  });

  const { data: allegations = [] } = useQuery({
    queryKey: ['/api/cases', id, 'allegations'],
    enabled: !!case_data,
    retry: false,
  });

  const updateAllegationMutation = useMutation({
    mutationFn: async ({ id, response, responseNotes }: { id: number; response: string; responseNotes: string }) => {
      await apiRequest('PUT', `/api/allegations/${id}`, { response, responseNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases', id, 'allegations'] });
    },
  });

  const handleResponseChange = (allegationId: number, response: string) => {
    setResponses(prev => ({
      ...prev,
      [allegationId]: {
        response,
        notes: prev[allegationId]?.notes || ''
      }
    }));
  };

  const handleNotesChange = (allegationId: number, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [allegationId]: {
        response: prev[allegationId]?.response || '',
        notes
      }
    }));
  };

  const handleSaveResponse = (allegationId: number) => {
    const responseData = responses[allegationId];
    if (responseData?.response) {
      updateAllegationMutation.mutate({
        id: allegationId,
        response: responseData.response,
        responseNotes: responseData.notes
      });
    }
  };

  const completedAllegations = allegations.filter((a: any) => a.response).length;
  const progressPercentage = allegations.length > 0 ? (completedAllegations / allegations.length) * 100 : 0;

  const daysUntilDeadline = case_data?.responseDeadline 
    ? Math.ceil((new Date(case_data.responseDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (!case_data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Draft Answer</h1>
          <p className="text-gray-600">Respond to each allegation in the complaint</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{completedAllegations} of {allegations.length} allegations completed</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>

            {/* Allegations */}
            <div className="space-y-6">
              {allegations.map((allegation: any, index: number) => {
                const isCompleted = !!allegation.response;
                const currentResponse = responses[allegation.id] || { response: allegation.response || '', notes: allegation.responseNotes || '' };

                return (
                  <Card key={allegation.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            isCompleted ? 'bg-green-500' : 'bg-primary'
                          }`}>
                            {isCompleted ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Allegation {allegation.allegationNumber}
                          </h3>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isCompleted ? 'Completed' : 'Active'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          "{allegation.allegationText}"
                        </p>
                      </div>

                      <div className="mb-4">
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Response
                        </Label>
                        <div className="flex space-x-3">
                          <Button
                            variant={currentResponse.response === 'deny' ? 'default' : 'outline'}
                            onClick={() => handleResponseChange(allegation.id, 'deny')}
                            className={currentResponse.response === 'deny' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Deny
                          </Button>
                          <Button
                            variant={currentResponse.response === 'admit' ? 'default' : 'outline'}
                            onClick={() => handleResponseChange(allegation.id, 'admit')}
                            className={currentResponse.response === 'admit' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-50 hover:border-green-300 hover:text-green-600'}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Admit
                          </Button>
                          <Button
                            variant={currentResponse.response === 'lack_knowledge' ? 'default' : 'outline'}
                            onClick={() => handleResponseChange(allegation.id, 'lack_knowledge')}
                            className={currentResponse.response === 'lack_knowledge' ? 'bg-yellow-500 hover:bg-yellow-600' : 'hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600'}
                          >
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Lack Knowledge
                          </Button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label htmlFor={`notes-${allegation.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes (Optional)
                        </Label>
                        <Textarea
                          id={`notes-${allegation.id}`}
                          value={currentResponse.notes}
                          onChange={(e) => handleNotesChange(allegation.id, e.target.value)}
                          placeholder="Add any specific details or explanations..."
                          rows={3}
                        />
                      </div>

                      {currentResponse.response && (
                        <Button
                          onClick={() => handleSaveResponse(allegation.id)}
                          disabled={updateAllegationMutation.isPending}
                          size="sm"
                        >
                          Save Response
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Continue Button */}
            <div className="mt-8 text-center">
              <Link href={`/case/${id}/affirmative-defenses`}>
                <Button size="lg" className="px-8 py-3">
                  Continue to Affirmative Defenses
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Response Guide */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Response Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900">Deny</div>
                    <div className="text-sm text-gray-600">You disagree with the allegation</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900">Admit</div>
                    <div className="text-sm text-gray-600">You agree with the allegation</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900">Lack Knowledge</div>
                    <div className="text-sm text-gray-600">You don't have enough information</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deadline Reminder */}
            {daysUntilDeadline && daysUntilDeadline > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="h-5 w-5 text-yellow-600 mr-3" />
                    <h3 className="font-semibold text-yellow-700">Deadline Reminder</h3>
                  </div>
                  <div className="text-center">
                    <CountdownTimer targetDate={case_data.responseDeadline} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
