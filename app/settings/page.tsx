"use client"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PersonIcon, BellIcon, SpeakerLoudIcon, GearIcon, TrashIcon } from "@radix-ui/react-icons"

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and podcast settings</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PersonIcon className="w-5 h-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter your first name" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter your last name" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" placeholder="Share a brief description about yourself and your podcasting interests" />
              </div>
              <Button>Save Profile</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellIcon className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you want to be notified about your podcasts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newEpisodes">New Episodes</Label>
                  <p className="text-sm text-muted-foreground">Get notified when new episodes are generated</p>
                </div>
                <Switch id="newEpisodes" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics">Analytics Updates</Label>
                  <p className="text-sm text-muted-foreground">Weekly reports on your podcast performance</p>
                </div>
                <Switch id="analytics" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing">Marketing Updates</Label>
                  <p className="text-sm text-muted-foreground">Tips and news about podcast creation</p>
                </div>
                <Switch id="marketing" />
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SpeakerLoudIcon className="w-5 h-5" />
                Audio Preferences
              </CardTitle>
              <CardDescription>Configure default audio settings for your podcasts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audioQuality">Default Audio Quality</Label>
                <Select defaultValue="high">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (128 kbps)</SelectItem>
                    <SelectItem value="high">High (256 kbps)</SelectItem>
                    <SelectItem value="premium">Premium (320 kbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="voiceSpeed">Default Voice Speed</Label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow (0.8x)</SelectItem>
                    <SelectItem value="normal">Normal (1.0x)</SelectItem>
                    <SelectItem value="fast">Fast (1.2x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoplay">Auto-play Next Episode</Label>
                  <p className="text-sm text-muted-foreground">Automatically play the next episode in queue</p>
                </div>
                <Switch id="autoplay" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GearIcon className="w-5 h-5" />
                AI Generation Settings
              </CardTitle>
              <CardDescription>Configure how AI generates your podcast content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="creativity">Creativity Level</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher creativity may produce more unique but less predictable content
                </p>
              </div>
              <div>
                <Label htmlFor="contentSources">Content Sources</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News Only</SelectItem>
                    <SelectItem value="academic">Academic Sources</SelectItem>
                    <SelectItem value="all">All Sources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="factCheck">Fact Checking</Label>
                  <p className="text-sm text-muted-foreground">Enable additional fact verification for content</p>
                </div>
                <Switch id="factCheck" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TrashIcon className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that will affect your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
