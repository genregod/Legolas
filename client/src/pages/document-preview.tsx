import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit, Gavel, Clock } from "lucide-react";
import Navigation from "@/components/navigation";
import CountdownTimer from "@/components/countdown-timer";

export default function DocumentPreview() {
  const { id } = useParams();

  const { data: case_data } = useQuery({
    queryKey: ['/api/cases', id],
    retry: false,
  });

  const { data: answerData } = useQuery({
    queryKey: ['/api/cases', id, 'generate-answer'],
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

  const daysUntilDeadline = case_data?.responseDeadline 
    ? Math.ceil((new Date(case_data.responseDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const selectedDefenses = defenses.filter((d: any) => d.selected);
  const respondedAllegations = allegations.filter((a: any) => a.response);

  if (!case_data || !answerData) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Answer Preview</h1>
          <p className="text-gray-600">Review your generated answer document</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <Card>
              {/* Document Header */}
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>ANSWER TO COMPLAINT</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Document Content */}
              <CardContent className="p-8 font-mono text-sm leading-relaxed">
                <div className="text-center mb-8">
                  <div className="font-bold">{case_data.court?.toUpperCase()}</div>
                  <div className="mt-4">
                    <div>{case_data.plaintiff?.toUpperCase()},</div>
                    <div className="ml-20">Plaintiff,</div>
                    <div className="mt-2">vs.</div>
                    <div className="mt-2">{case_data.defendant?.toUpperCase()},</div>
                    <div className="ml-20">Defendant.</div>
                  </div>
                  <div className="mt-4 text-right">
                    <div>Case No. {case_data.caseNumber}</div>
                    <div className="mt-2 font-bold">ANSWER TO COMPLAINT</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="font-bold mb-2">TO THE {case_data.court?.toUpperCase()}:</div>
                    <p>Defendant {case_data.defendant?.toUpperCase()} hereby answers the complaint filed against him by plaintiff {case_data.plaintiff?.toUpperCase()} as follows:</p>
                  </div>

                  <div>
                    <div className="font-bold mb-2">GENERAL DENIAL</div>
                    <p>1. Defendant denies each and every allegation contained in the complaint, except as specifically admitted herein.</p>
                  </div>

                  <div>
                    <div className="font-bold mb-2">SPECIFIC RESPONSES TO ALLEGATIONS</div>
                    {respondedAllegations.map((allegation: any, index: number) => (
                      <p key={allegation.id}>
                        {index + 2}. Responding to Paragraph {allegation.allegationNumber} of the complaint, defendant {allegation.response?.toUpperCase()} the allegations contained therein.
                      </p>
                    ))}
                  </div>

                  {selectedDefenses.length > 0 && (
                    <div>
                      <div className="font-bold mb-2">AFFIRMATIVE DEFENSES</div>
                      {selectedDefenses.map((defense: any, index: number) => (
                        <p key={defense.id}>
                          {respondedAllegations.length + index + 2}. <strong>{(index + 1).toString().toUpperCase()} AFFIRMATIVE DEFENSE ({defense.defenseTitle}):</strong> {defense.defenseDescription}
                        </p>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="font-bold mb-2">PRAYER FOR RELIEF</div>
                    <p>WHEREFORE, defendant prays for judgment as follows:</p>
                    <p>1. That plaintiff take nothing by way of this action;</p>
                    <p>2. That this action be dismissed with prejudice;</p>
                    <p>3. For costs of suit incurred herein;</p>
                    <p>4. For such other and further relief as the Court deems just and proper.</p>
                  </div>

                  <div className="mt-8">
                    <div className="text-right">
                      <div>Respectfully submitted,</div>
                      <div className="mt-8">________________________</div>
                      <div>{case_data.defendant?.toUpperCase()}</div>
                      <div>Defendant in Pro Per</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Actions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Link href={`/case/${id}/filing-instructions`}>
                  <Button variant="outline" className="w-full">
                    <Gavel className="h-4 w-4 mr-2" />
                    Filing Instructions
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Document
                </Button>
              </CardContent>
            </Card>

            {/* Document Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Document Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allegations:</span>
                  <span className="font-medium">{respondedAllegations.length} responded</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Defenses:</span>
                  <span className="font-medium">{selectedDefenses.length} selected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Ready to file</span>
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
                    <div className="text-sm text-gray-600 mt-2">To file your answer</div>
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
