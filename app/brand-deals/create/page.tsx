"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  BackpackIcon,
  TokensIcon,
  CalendarIcon,
  InfoCircledIcon,
  RocketIcon,
  PlusIcon,
  Cross1Icon
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const steps = [
  { id: 1, name: "Brand Info", description: "Company and product details" },
  { id: 2, name: "Campaign", description: "Requirements and targeting" },
  { id: 3, name: "Budget", description: "Web3 staking and payment" },
  { id: 4, name: "Review", description: "Confirm and deploy" },
]

const categories = [
  "Technology", "Lifestyle", "Education", "Finance", "Health", 
  "Entertainment", "Food & Beverage", "Fashion", "Travel", "Gaming"
]

const currencies = [
  { symbol: "ETH", name: "Ethereum", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", decimals: 6 },
  { symbol: "USDT", name: "Tether", decimals: 6 },
]

export default function CreateBrandDeal() {
  const router = useRouter()
  const { address, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Brand Info
    brandName: "",
    productName: "",
    description: "",
    website: "",
    brandLogo: "",
    
    // Campaign Details
    category: "",
    targetAudience: "",
    requirements: [] as string[],
    newRequirement: "",
    tags: [] as string[],
    newTag: "",
    duration: "",
    
    // Budget & Payment
    budget: "",
    currency: "ETH",
    paymentType: "milestone", // milestone or upfront
    escrowEnabled: true,
    autoRelease: false,
    
    // Advanced
    exclusivity: false,
    contentApproval: true,
    performanceMetrics: false,
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addRequirement = () => {
    if (formData.newRequirement.trim() && !formData.requirements.includes(formData.newRequirement.trim())) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, prev.newRequirement.trim()],
        newRequirement: "",
      }))
    }
  }

  const removeRequirement = (requirement: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((r) => r !== requirement),
    }))
  }

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: "",
      }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!isAuthenticated || !address) {
      toast.error("Please connect your wallet to create a brand deal")
      return
    }

    setIsLoading(true)
    try {
      // Here you would integrate with your smart contract
      // For now, we'll simulate the process
      
      toast.loading("Deploying smart contract...", { id: "deploy" })
      
      // Simulate contract deployment
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast.success("Brand deal created successfully!", { id: "deploy" })
      
      // Redirect to the brand deals page
      router.push('/brand-deals')
      
    } catch (error) {
      console.error("Error creating brand deal:", error)
      toast.error("Failed to create brand deal. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/70 text-transparent bg-clip-text mb-3">
              Create Brand Deal
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Set up a Web3-powered brand partnership with secure budget staking and smart contract automation.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300",
                        currentStep >= step.id ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground",
                        currentStep > step.id && "bg-green-500"
                      )}
                    >
                      {currentStep > step.id ? <CheckIcon className="w-5 h-5" /> : step.id}
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-sm font-medium transition-colors",
                        currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn("w-16 h-1 mx-4 rounded-full", currentStep > step.id ? "bg-primary" : "bg-muted")} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-card/50 border-border/50 backdrop-blur-lg">
            <CardContent className="p-8">
              {/* Step 1: Brand Info */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                      <BackpackIcon className="w-6 h-6 text-primary" />
                      Brand Information
                    </CardTitle>
                    <CardDescription className="text-base">
                      Tell us about your brand and the product you want to promote.
                    </CardDescription>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="brandName" className="text-lg">Brand Name</Label>
                      <Input
                        id="brandName"
                        placeholder="e.g., TechFlow Solutions"
                        value={formData.brandName}
                        onChange={(e) => updateFormData("brandName", e.target.value)}
                        className="text-base p-6 mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="productName" className="text-lg">Product Name</Label>
                      <Input
                        id="productName"
                        placeholder="e.g., AI Code Assistant Pro"
                        value={formData.productName}
                        onChange={(e) => updateFormData("productName", e.target.value)}
                        className="text-base p-6 mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-lg">Product Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your product, its benefits, and why podcasters should promote it..."
                      className="min-h-32 text-base p-4 mt-2"
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="website" className="text-lg">Website URL</Label>
                      <Input
                        id="website"
                        placeholder="https://your-brand.com"
                        value={formData.website}
                        onChange={(e) => updateFormData("website", e.target.value)}
                        className="text-base p-6 mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brandLogo" className="text-lg">Brand Logo (Emoji)</Label>
                      <Input
                        id="brandLogo"
                        placeholder="🚀"
                        value={formData.brandLogo}
                        onChange={(e) => updateFormData("brandLogo", e.target.value)}
                        className="text-base p-6 mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Campaign Details */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                      <CalendarIcon className="w-6 h-6 text-primary" />
                      Campaign Details
                    </CardTitle>
                    <CardDescription className="text-base">
                      Define your campaign requirements and target audience.
                    </CardDescription>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category" className="text-lg">Category</Label>
                      <Select onValueChange={(value) => updateFormData("category", value)} defaultValue={formData.category}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration" className="text-lg">Campaign Duration</Label>
                      <Select onValueChange={(value) => updateFormData("duration", value)} defaultValue={formData.duration}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="targetAudience" className="text-lg">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="e.g., Developers, Tech Enthusiasts, Startup Founders"
                      value={formData.targetAudience}
                      onChange={(e) => updateFormData("targetAudience", e.target.value)}
                      className="text-base p-6 mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-lg">Campaign Requirements</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add specific requirements for podcasters (e.g., mention frequency, content guidelines).
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a requirement..."
                        value={formData.newRequirement}
                        onChange={(e) => updateFormData("newRequirement", e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                        className="p-6"
                      />
                      <Button type="button" onClick={addRequirement} className="p-6">
                        Add
                      </Button>
                    </div>
                    {formData.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.requirements.map((req) => (
                          <Badge
                            key={req}
                            variant="secondary"
                            className="text-sm py-1 px-3 cursor-pointer hover:bg-destructive/80"
                            onClick={() => removeRequirement(req)}
                          >
                            {req} <Cross1Icon className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-lg">Tags</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add relevant tags to help podcasters find your deal.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={formData.newTag}
                        onChange={(e) => updateFormData("newTag", e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        className="p-6"
                      />
                      <Button type="button" onClick={addTag} className="p-6">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-sm py-1 px-3 cursor-pointer hover:bg-destructive/80"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} <Cross1Icon className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Budget & Web3 */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                      <TokensIcon className="w-6 h-6 text-primary" />
                      Budget & Web3 Staking
                    </CardTitle>
                    <CardDescription className="text-base">
                      Set your budget and configure smart contract parameters.
                    </CardDescription>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="budget" className="text-lg">Budget Amount</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        placeholder="5.0"
                        value={formData.budget}
                        onChange={(e) => updateFormData("budget", e.target.value)}
                        className="text-base p-6 mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="currency" className="text-lg">Currency</Label>
                      <Select onValueChange={(value) => updateFormData("currency", value)} defaultValue={formData.currency}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem key={curr.symbol} value={curr.symbol}>
                              {curr.symbol} - {curr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Smart Contract Options */}
                  <div className="space-y-6 p-6 bg-muted/20 rounded-lg border">
                    <h3 className="text-lg font-semibold">Smart Contract Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="escrowEnabled" className="text-base font-medium">Enable Escrow</Label>
                          <p className="text-sm text-muted-foreground">Funds are held in escrow until campaign completion</p>
                        </div>
                        <Switch
                          id="escrowEnabled"
                          checked={formData.escrowEnabled}
                          onCheckedChange={(checked) => updateFormData("escrowEnabled", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="autoRelease" className="text-base font-medium">Auto-Release Funds</Label>
                          <p className="text-sm text-muted-foreground">Automatically release funds when requirements are met</p>
                        </div>
                        <Switch
                          id="autoRelease"
                          checked={formData.autoRelease}
                          onCheckedChange={(checked) => updateFormData("autoRelease", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="exclusivity" className="text-base font-medium">Exclusive Partnership</Label>
                          <p className="text-sm text-muted-foreground">Podcaster cannot promote competing products</p>
                        </div>
                        <Switch
                          id="exclusivity"
                          checked={formData.exclusivity}
                          onCheckedChange={(checked) => updateFormData("exclusivity", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="contentApproval" className="text-base font-medium">Content Approval Required</Label>
                          <p className="text-sm text-muted-foreground">Review content before funds are released</p>
                        </div>
                        <Switch
                          id="contentApproval"
                          checked={formData.contentApproval}
                          onCheckedChange={(checked) => updateFormData("contentApproval", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gas Fee Estimate */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <InfoCircledIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Estimated Gas Fees</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Contract deployment: ~0.005 ETH | Budget staking: ~0.002 ETH
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div>
                    <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                      <RocketIcon className="w-6 h-6 text-primary" />
                      Review & Deploy
                    </CardTitle>
                    <CardDescription className="text-base">
                      Review your brand deal details before deploying the smart contract.
                    </CardDescription>
                  </div>

                  <div className="space-y-6 rounded-lg border p-6 bg-background/50">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Brand Information</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <p><span className="font-medium">Brand:</span> {formData.brandName || "Not set"}</p>
                        <p><span className="font-medium">Product:</span> {formData.productName || "Not set"}</p>
                        <p><span className="font-medium">Category:</span> {formData.category || "Not set"}</p>
                        <p><span className="font-medium">Duration:</span> {formData.duration ? `${formData.duration} days` : "Not set"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Budget & Payment</h4>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-800">Total Budget</span>
                          <span className="text-2xl font-bold text-green-800">{formData.budget || "0"} {formData.currency}</span>
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                          Escrow: {formData.escrowEnabled ? "Enabled" : "Disabled"} | 
                          Auto-release: {formData.autoRelease ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Requirements</h4>
                      {formData.requirements.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {formData.requirements.map((req) => (
                            <li key={req}>{req}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No requirements added</p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Tags</h4>
                      {formData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags added</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-12 flex justify-between">
                <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1 || isLoading}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                {currentStep < steps.length ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying Contract...
                      </>
                    ) : (
                      <>
                        <RocketIcon className="mr-2 h-4 w-4" />
                        Deploy Brand Deal
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}