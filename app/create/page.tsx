"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { authenticatedFetch } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  SpeakerLoudIcon,
  PersonIcon,
  ClockIcon,
  InfoCircledIcon,
  RocketIcon,
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const steps = [
  { id: 1, name: "Concept", description: "Describe your podcast idea" },
  { id: 2, name: "Hosts", description: "Configure AI hosts" },
  { id: 3, name: "Settings", description: "Schedule and preferences" },
  { id: 4, name: "Review", description: "Confirm and create" },
]

const toneOptions = [
  { value: "casual", label: "Casual & Friendly" },
  { value: "professional", label: "Professional" },
  { value: "educational", label: "Educational" },
  { value: "humorous", label: "Humorous" },
  { value: "debate", label: "Debate Style" },
  { value: "storytelling", label: "Storytelling" },
]

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
]

const lengthOptions = [
  { value: "short", label: "Short (5-10 min)" },
  { value: "medium", label: "Medium (15-25 min)" },
  { value: "long", label: "Long (30-45 min)" },
  { value: "extended", label: "Extended (60+ min)" },
]

export default function CreatePodcast() {
  const router = useRouter()
  const { address } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    concept: "",
    tone: "",
    frequency: "",
    length: "",
    characters: [
      { name: "", personality: "", voice: "", gender: "male" },
      { name: "", personality: "", voice: "", gender: "female" },
    ],
    topics: [] as string[],
    newTopic: "",
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTopic = () => {
    if (formData.newTopic.trim() && !formData.topics.includes(formData.newTopic.trim())) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, prev.newTopic.trim()],
        newTopic: "",
      }))
    }
  }

  const removeTopic = (topic: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t !== topic),
    }))
  }

  const updateCharacter = (index: number, field: string, value: string) => {
    const newCharacters = [...formData.characters]
    newCharacters[index] = { ...newCharacters[index], [field]: value }
    setFormData((prev) => ({ ...prev, characters: newCharacters }))
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
    const validCharacters = formData.characters.filter(char => char.name.trim() && char.personality.trim());
    
    if (validCharacters.length === 0) {
      alert('Please provide at least one character with both name and personality.');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.concept.trim() || 
        !formData.tone || !formData.frequency || !formData.length) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsLoading(true)
    try {
      const submitData = {
        ...formData,
        characters: validCharacters
      };

      const response = await authenticatedFetch('/api/podcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      }, address);

      if (response.ok) {
        const newPodcast = await response.json();
        console.log("Podcast created:", newPodcast);
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        console.error("Failed to create podcast:", errorData.message);
        alert(`Failed to create podcast: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert('An error occurred while creating the podcast. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/70 text-transparent bg-clip-text mb-3">
            Create Your AI Podcast
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bring your podcast vision to life. Describe your idea, and let our AI handle the rest.
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
            {/* Step 1: Concept */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                    <SpeakerLoudIcon className="w-6 h-6 text-primary" />
                    Describe Your Podcast Concept
                  </CardTitle>
                  <CardDescription className="text-base">
                    This is where the magic begins. Tell us about your podcast in natural language.
                  </CardDescription>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-lg">Podcast Title</Label>
                    <Input
                      id="title"
                      placeholder="What would you like to call your podcast?"
                      value={formData.title}
                      onChange={(e) => updateFormData("title", e.target.value)}
                      className="text-base p-6 mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="concept" className="text-lg">Concept Description</Label>
                    <Textarea
                      id="concept"
                      placeholder="Describe your podcast concept in detail. What topics will it cover? What's the format? What makes it unique and engaging for listeners?"
                      className="min-h-40 text-base p-4 mt-2"
                      value={formData.concept}
                      onChange={(e) => updateFormData("concept", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-lg">Short Description for Audience</Label>
                    <Textarea
                      id="description"
                      placeholder="Write a compelling description that will attract listeners. What can they expect from your show?"
                      className="min-h-24 text-base p-4 mt-2"
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-lg">Topics & Keywords</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add topics to guide the AI's content generation.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter topics your podcast will cover (e.g., Technology, Business, Health)"
                        value={formData.newTopic}
                        onChange={(e) => updateFormData("newTopic", e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                        className="p-6"
                      />
                      <Button type="button" onClick={addTopic} className="p-6">
                        Add
                      </Button>
                    </div>
                    {formData.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.topics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-sm py-1 px-3 cursor-pointer hover:bg-destructive/80"
                            onClick={() => removeTopic(topic)}
                          >
                            {topic} &times;
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Characters */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                    <PersonIcon className="w-6 h-6 text-primary" />
                    Configure AI Hosts
                  </CardTitle>
                  <CardDescription className="text-base">
                    Define the personalities of your AI-powered podcast hosts. You can have up to two.
                  </CardDescription>
                </div>

                {formData.characters.map((character, index) => (
                  <div key={index} className="p-6 border rounded-lg bg-background/50">
                    <h4 className="font-semibold text-lg mb-4">Host {index + 1}</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor={`char-name-${index}`}>Host Name</Label>
                        <Input
                          id={`char-name-${index}`}
                          placeholder="e.g., Alex, Dr. Evelyn Reed"
                          value={character.name}
                          onChange={(e) => updateCharacter(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`char-gender-${index}`}>Gender</Label>
                        <Select
                          onValueChange={(value) => updateCharacter(index, "gender", value)}
                          defaultValue={character.gender}
                        >
                          <SelectTrigger id={`char-gender-${index}`}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <Label htmlFor={`char-personality-${index}`}>Personality</Label>
                      <Textarea
                        id={`char-personality-${index}`}
                        placeholder="e.g., A curious and witty tech enthusiast who loves to explore the latest gadgets. Tends to be skeptical but open-minded."
                        value={character.personality}
                        onChange={(e) => updateCharacter(index, "personality", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Settings */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                    <ClockIcon className="w-6 h-6 text-primary" />
                    Podcast Settings
                  </CardTitle>
                  <CardDescription className="text-base">
                    Set the tone, frequency, and other details for your podcast series.
                  </CardDescription>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select onValueChange={(value) => updateFormData("tone", value)} defaultValue={formData.tone}>
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Release Frequency</Label>
                    <Select onValueChange={(value) => updateFormData("frequency", value)} defaultValue={formData.frequency}>
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">Episode Length</Label>
                    <Select onValueChange={(value) => updateFormData("length", value)} defaultValue={formData.length}>
                      <SelectTrigger id="length">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        {lengthOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Topics to Cover</Label>
                  <CardDescription>
                    Add some initial topics or questions for your AI hosts to discuss.
                  </CardDescription>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., The future of artificial intelligence"
                      value={formData.newTopic}
                      onChange={(e) => updateFormData("newTopic", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTopic()}
                    />
                    <Button onClick={addTopic} variant="outline">
                      Add Topic
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-sm">
                        {topic}
                        <button onClick={() => removeTopic(topic)} className="ml-2 font-bold">
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                    <RocketIcon className="w-6 h-6 text-primary" />
                    Review and Create
                  </CardTitle>
                  <CardDescription className="text-base">
                    Confirm the details of your new AI podcast.
                  </CardDescription>
                </div>

                <div className="space-y-6 rounded-lg border p-6 bg-background/50">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Podcast Title</h4>
                    <p className="text-muted-foreground">{formData.title || "Not set"}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Description</h4>
                    <p className="text-muted-foreground">{formData.description || "Not set"}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Concept</h4>
                    <p className="text-muted-foreground">{formData.concept || "Not set"}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-lg mb-3">AI Hosts</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {formData.characters.map((char, index) => (
                        <div key={index} className="space-y-2 rounded-md border p-4 bg-background/30">
                          <p className="font-bold">{char.name || `Host ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Personality:</span> {char.personality || "Not set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Tone</h4>
                      <p className="text-muted-foreground">{formData.tone || "Not set"}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Frequency</h4>
                      <p className="text-muted-foreground">{formData.frequency || "Not set"}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">Length</h4>
                      <p className="text-muted-foreground">{formData.length || "Not set"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Topics</h4>
                    {formData.topics.length > 0 ? (
                      <ul className="list-disc list-inside text-muted-foreground">
                        {formData.topics.map((topic) => (
                          <li key={topic}>{topic}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No topics added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || isLoading}>
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
                      Creating...
                    </>
                  ) : (
                    "Create Podcast"
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
