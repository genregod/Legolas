import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Info, TriangleAlert } from "lucide-react";
import Navigation from "@/components/navigation";

export default function FilingInstructions() {
  const { id } = useParams();

  const { data: case_data } = useQuery({
    queryKey: ['/api/cases', id],
    retry: false,
  });

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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Filing Instructions</h1>
          <p className="text-gray-600">Step-by-step guide to file your answer with the court</p>
        </div>

        {/* Filing Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Print Your Answer</h3>
                  <p className="text-gray-600 mb-4">
                    Print your answer document on legal-size paper (8.5" x 14") if available, or letter-size paper (8.5" x 11").
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Info className="inline h-4 w-4 mr-2" />
                      <strong>Tip:</strong> Print multiple copies - you'll need originals for the court and copies for service.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign the Document</h3>
                  <p className="text-gray-600 mb-4">
                    Sign the answer document in the designated signature area. Use blue or black ink only.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <TriangleAlert className="inline h-4 w-4 mr-2" />
                      <strong>Important:</strong> Only sign the original document that you'll file with the court.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">File with the Court</h3>
                  <p className="text-gray-600 mb-4">
                    Take your signed answer to the court clerk's office for filing.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-gray-900">Court Address:</div>
                        <div className="text-gray-700">
                          {case_data.court}<br />
                          {/* Mock address for demo */}
                          111 N Hill St<br />
                          Los Angeles, CA 90012
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Filing Fee:</div>
                        <div className="text-gray-700">$435.00</div>
                        <div className="font-semibold text-gray-900 mt-2">Hours:</div>
                        <div className="text-gray-700">Mon-Fri: 8:30 AM - 4:30 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Serve the Plaintiff</h3>
                  <p className="text-gray-600 mb-4">
                    After filing, you must serve a copy of your answer on the plaintiff or their attorney.
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-800">
                      <TriangleAlert className="inline h-4 w-4 mr-2" />
                      <strong>Critical:</strong> Service must be completed within 5 days of filing your answer.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link href={`/case/${id}`}>
            <Button size="lg" className="px-8 py-3">
              <Check className="h-4 w-4 mr-2" />
              Mark as Filed
            </Button>
          </Link>
          <Link href={`/case/${id}/document-preview`}>
            <Button variant="outline" size="lg" className="px-8 py-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Document
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
