import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bot, Lightbulb, Info, FileText } from "lucide-react";
import Navigation from "@/components/navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AffirmativeDefenses() {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedDefenses, setSelectedDefenses] = useState<Set<number>>(new Set());

  const { data: case_data } = useQuery({
    queryKey: ['/api/cases', id],
    retry: false,
  });

  const { data: defenses = [] } = useQuery({
    queryKey: ['/api/cases', id, 'defenses'],
    enabled: !!case_data,
    retry: false,
  });

  const updateDefenseMutation = useMutation({
    mutationFn: async ({ id, selected }: { id: number; selected: boolean }) => {
      await apiRequest('PUT', `/api/defenses/${id}`, { selected });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cases', id, 'defenses'] });
      toast({
        title: "Defense updated",
        description: "Your defense selection has been saved.",
      });
    },
  });

  const handleDefenseToggle = (defenseId: number, selected: boolean) => {
    updateDefenseMutation.mutate({ id: defenseId, selected });
    
    if (selected) {
      setSelectedDefenses(prev => new Set(prev).add(defenseId));
    } else {
      setSelectedDefenses(prev => {
        const newSet = new Set(prev);
        newSet.delete(defenseId);
        return newSet;
      });
    }
  };

  const recommendedDefenses = defenses.filter((d: any) => 
    ['statute_of_limitations', 'failure_to_state_claim'].includes(d.defenseType)
  );

  const otherDefenses = defenses.filter((d: any) => 
    !['statute_of_limitations', 'failure_to_state_claim'].includes(d.defenseType)
  );

  const selectedCount = defenses.filter((d: any) => d.selected).length;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Affirmative Defenses</h1>
          <p className="text-gray-600">Select defenses that apply to your case</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* AI Suggested Defenses */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Bot className="h-6 w-6 text-primary mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">AI Suggested Defenses</h2>
              </div>
              <div className="space-y-4">
                {recommendedDefenses.map((defense: any) => (
                  <Card key={defense.id} className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start">
                          <Checkbox
                            id={`defense-${defense.id}`}
                            checked={defense.selected}
                            onCheckedChange={(checked) => handleDefenseToggle(defense.id, checked as boolean)}
                            className="mt-1 mr-4"
                          />
                          <div>
                            <Label htmlFor={`defense-${defense.id}`} className="font-semibold text-gray-900 cursor-pointer">
                              {defense.defenseTitle}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">{defense.defenseDescription}</p>
                          </div>
                        </div>
                        <div className="bg-primary/10 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-primary">Recommended</span>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <Lightbulb className="inline h-4 w-4 mr-2" />
                          <strong>Why this applies:</strong> {
                            defense.defenseType === 'statute_of_limitations' 
                              ? 'The alleged contract breach occurred over 4 years ago, exceeding the 4-year limitation period for contract claims in California.'
                              : 'The complaint lacks essential elements required for a valid contract claim, including consideration and mutual assent.'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Other Available Defenses */}
            {otherDefenses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Available Defenses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherDefenses.map((defense: any) => (
                    <Card key={defense.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <Checkbox
                            id={`defense-${defense.id}`}
                            checked={defense.selected}
                            onCheckedChange={(checked) => handleDefenseToggle(defense.id, checked as boolean)}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <Label htmlFor={`defense-${defense.id}`} className="font-medium text-gray-900 cursor-pointer">
                              {defense.defenseTitle}
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">{defense.defenseDescription}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Document Button */}
            <div className="text-center">
              <Link href={`/case/${id}/document-preview`}>
                <Button size="lg" className="px-8 py-3">
                  Generate Answer Document
                  <FileText className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Selected Defenses */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Selected Defenses</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCount === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No defenses selected yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {defenses.filter((d: any) => d.selected).map((defense: any) => (
                      <div key={defense.id} className="text-sm">
                        <div className="font-medium text-gray-900">{defense.defenseTitle}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legal Tip */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Legal Tip</h3>
                    <p className="text-sm text-blue-800">
                      Affirmative defenses must be raised in your answer or they may be waived. Select all that apply to your situation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
