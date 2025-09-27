"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BackpackIcon,
  PlusIcon
} from "@radix-ui/react-icons"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"





export default function BrandDealsPage() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("create")






  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/70 text-transparent bg-clip-text mb-4">
            Brand Partnership Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect brands with podcast creators through secure Web3 contracts. Stake budgets, track performance, and build authentic partnerships.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create" className="gap-2">
              <PlusIcon className="w-4 h-4" />
              Create Deal
            </TabsTrigger>
            <TabsTrigger value="my-deals" className="gap-2">
              <BackpackIcon className="w-4 h-4" />
              My Deals
            </TabsTrigger>
          </TabsList>



          {/* Create Deal Tab */}
          <TabsContent value="create">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Create Brand Deal</CardTitle>
                <CardDescription>
                  Set up a new brand partnership with Web3 budget staking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BackpackIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Your Brand Deal</h3>
                  <p className="text-muted-foreground mb-6">
                    Connect your wallet to create and stake budget for brand partnerships
                  </p>
                  <Button size="lg" asChild>
                    <Link href="/brand-deals/create">
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Start Creating
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Deals Tab */}
          <TabsContent value="my-deals">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">My Brand Deals</CardTitle>
                <CardDescription>
                  Manage your active partnerships and applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="text-center py-12">
                    <BackpackIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Deals</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't created or applied to any brand deals yet
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => setActiveTab("create")}>
                        Create Deal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your wallet to view and manage your brand deals
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Partner with Brands?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join our Web3-powered brand partnership ecosystem and monetize your podcast content.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setActiveTab("create")}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Deal
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}