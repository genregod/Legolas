import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Scale, Bot, FileText, Clock, Edit3, ExternalLink, Brain, Shield, Zap, BarChart, Users, Lock } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-primary">ArnieAI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors">Features</a>
              <a href="#technology" className="text-gray-600 hover:text-primary transition-colors">Technology</a>
              <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-primary transition-colors">About</a>
              <Button onClick={handleLogin} variant="outline">Sign In</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">Powered by GPT-4 Legal AI</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900">
                Professional Legal AI for Everyone
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Advanced AI-powered legal document analysis and case management. Get the same legal reasoning that passed the bar exam at the 90th percentile - for 80% less than traditional legal research tools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button onClick={handleLogin} size="lg" className="w-full sm:w-auto">
                  Start Free Trial <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-1">
                <Card className="p-6 bg-white">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Bot className="h-8 w-8 text-primary" />
                      <h3 className="text-lg font-semibold">AI Legal Analysis in Progress</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Extracting text with Azure AI OCR...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Analyzing with GPT-4 legal model...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Searching case law database...</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Result:</strong> 3 affirmative defenses identified with 95% confidence
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Legal AI Technology</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on the same AI that achieved bar exam performance in the 90th percentile, integrated with advanced document processing and legal knowledge retrieval
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">GPT-4 Legal Reasoning</h3>
              <p className="text-gray-600 mb-4">
                Advanced language model fine-tuned on legal data with Reinforcement Learning from Human Feedback (RLHF) for accuracy
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>90th percentile bar exam performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Multi-step legal analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Citation verification</span>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Azure AI Document Intelligence</h3>
              <p className="text-gray-600 mb-4">
                Professional-grade OCR and document structure analysis optimized for legal documents
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>99%+ OCR accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Multi-page document support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Handwritten text recognition</span>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">RAG Legal Knowledge Base</h3>
              <p className="text-gray-600 mb-4">
                Retrieval-Augmented Generation with vectorized legal database for accurate, citation-backed responses
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>256GB legal corpus</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Real-time case law updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Semantic search capabilities</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need for Legal Success</h2>
            <p className="text-xl text-gray-600">Comprehensive features designed for pro se litigants and legal professionals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Bot className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Legal Document Analysis</h3>
              <p className="text-gray-600">Upload any legal document and get instant AI-powered analysis with key points, deadlines, and strategic recommendations</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Affirmative Defense Generator</h3>
              <p className="text-gray-600">AI suggests relevant affirmative defenses based on case law with strength assessments and legal citations</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Edit3 className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Legal Document Drafting</h3>
              <p className="text-gray-600">Generate court-ready responses, motions, and legal documents with proper formatting and citations</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Clock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Deadline Management</h3>
              <p className="text-gray-600">Never miss a filing deadline with automated tracking, reminders, and calendar integration</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <BarChart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
              <p className="text-gray-600">AI-powered case evaluation with risk factors, success probability, and strategic recommendations</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Lock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-gray-600">Bank-grade encryption, Azure Key Vault security, and full compliance with legal data regulations</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Professional legal AI for less than traditional research tools</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Free Trial</h3>
                <div className="text-3xl font-bold mb-1">$0</div>
                <p className="text-gray-600">14 days</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">5 document analyses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Basic AI features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">1 active case</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-400">Document generation</span>
                </li>
              </ul>
              <Button onClick={handleLogin} variant="outline" className="w-full">
                Start Free Trial
              </Button>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="px-3 py-1">MOST POPULAR</Badge>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Professional</h3>
                <div className="text-3xl font-bold mb-1">$49</div>
                <p className="text-gray-600">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Unlimited document analyses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">GPT-4 legal reasoning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Unlimited cases</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Document generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              <Button onClick={handleLogin} className="w-full">
                Get Started
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Compare</h3>
                <div className="text-3xl font-bold mb-1">Save 80%</div>
                <p className="text-gray-600">vs competitors</p>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-semibold">ArnieAI</p>
                  <p className="text-2xl font-bold text-primary">$49/mo</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Casetext</p>
                  <p className="text-xl text-gray-500 line-through">$90/mo</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Westlaw</p>
                  <p className="text-xl text-gray-500 line-through">$300+/mo</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Professional legal AI at a fraction of the cost
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Built for Trust & Accuracy</h2>
                <p className="text-lg mb-6">
                  Our AI includes comprehensive guardrails and citation verification to ensure accuracy. Every legal statement is backed by real sources.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 flex-shrink-0" />
                    <span>All outputs include source citations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 flex-shrink-0" />
                    <span>Bank-grade encryption & security</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 flex-shrink-0" />
                    <span>Human expert review available</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <blockquote className="text-lg italic mb-4">
                  "ArnieAI helped me understand my legal situation and respond to a complaint professionally. The AI analysis was thorough and the suggested defenses were spot-on."
                </blockquote>
                <p className="font-semibold">Sarah M.</p>
                <p className="text-sm opacity-90">Small Business Owner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Legal Work?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands using AI to handle legal matters confidently and affordably
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleLogin} size="lg">
              Start Your Free Trial
            </Button>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Scale className="h-6 w-6 mr-2" />
                <span className="text-lg font-semibold">ArnieAI</span>
              </div>
              <p className="text-sm text-gray-400">
                Professional legal AI technology democratizing access to justice
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 ArnieAI. All rights reserved. | AI outputs are not legal advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}