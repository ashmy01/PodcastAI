"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button, buttonVariants } from "./ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Cross1Icon, PlayIcon, SpeakerLoudIcon } from "@radix-ui/react-icons"
import { useIsV0 } from "@/lib/context"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { WalletConnectButton } from "./wallet-connect-button"

const DURATION = 0.3
const DELAY = DURATION
const EASE_OUT = "easeOut"
const EASE_OUT_OPACITY = [0.25, 0.46, 0.45, 0.94] as const
const SPRING = {
  type: "spring" as const,
  stiffness: 60,
  damping: 10,
  mass: 0.8,
}

export const PodcastHero = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const isInitialRender = useRef(true)

  useEffect(() => {
    return () => {
      isInitialRender.current = false
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div className="flex overflow-hidden relative flex-col gap-4 justify-center items-center pt-10 w-full h-full short:lg:pt-10 pb-footer-safe-area 2xl:pt-footer-safe-area px-sides short:lg:gap-4 lg:gap-8 ">
      <motion.div layout="position" transition={{ duration: DURATION, ease: EASE_OUT }} className="text-center bg-white/5 backdrop-blur-s border border-white/10 rounded-lg p-4">
        <h1 className="font-serif text-5xl short:lg:text-8xl sm:text-8xl lg:text-9xl text-black mb-4">
          Podcast AI
        </h1>
        <p className="text-lg md:text-xl text-black/80 max-w-2xl text-balance">
          Create dynamic AI-powered podcasts with natural language. Just describe your vision, and watch it come to
          life.
        </p>
      </motion.div>

      <div className="flex flex-col items-center min-h-0 shrink">
        <AnimatePresenceGuard>
          {!isOpen && (
            <motion.div
              key="hero-content"
              initial={isInitialRender.current ? false : "hidden"}
              animate="visible"
              exit="exit"
              variants={{
                visible: {
                  scale: 1,
                  transition: {
                    delay: DELAY,
                    duration: DURATION,
                    ease: EASE_OUT,
                  },
                },
                hidden: {
                  scale: 0.9,
                  transition: { duration: DURATION, ease: EASE_OUT },
                },
                exit: {
                  y: -150,
                  scale: 0.9,
                  transition: { duration: DURATION, ease: EASE_OUT },
                },
              }}
            >
              <div className="flex flex-col gap-6 w-full max-w-xl md:gap-8 lg:gap-10 items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  {isAuthenticated ? (
                    <Button onClick={()=>{router.push("/create")}} size="lg" className="flex-1 gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-black hover:bg-white/20">
                      <SpeakerLoudIcon className="w-4 h-4" />
                      Start Creating
                    </Button>
                  ) : (
                    <WalletConnectButton size="lg" className="flex-1 gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-black hover:bg-white/20">
                      <SpeakerLoudIcon className="w-4 h-4" />
                      Connect Wallet to Start
                    </WalletConnectButton>
                  )}
                  <Button size="lg" className="flex-1 gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-black hover:bg-white/20">
                    <PlayIcon className="w-4 h-4" />
                    Listen to Demo
                  </Button>
                </div>

                <motion.div
                  initial={isInitialRender.current ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: {
                      duration: DURATION,
                      ease: EASE_OUT_OPACITY,
                    },
                  }}
                  transition={{
                    duration: DURATION,
                    ease: EASE_OUT,
                    delay: DELAY,
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-center"
                >
                  <div className="p-4 rounded-lg bg-card border">
                    <h3 className="font-semibold text-white mb-2">AI-Generated</h3>
                    <p className="text-sm text-white/80">
                      Multi-character conversations with distinct personalities
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <h3 className="font-semibold text-white mb-2">Auto-Refresh</h3>
                    <p className="text-sm text-white/80">Fresh episodes generated at your chosen intervals</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border">
                    <h3 className="font-semibold text-white mb-2">Natural Language</h3>
                    <p className="text-sm text-white/80">Just describe your podcast idea in plain English</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          <motion.div layout="position" transition={SPRING} key="button" className={isOpen ? "my-6" : "mt-6"}>
            <Button
              size="lg"
              className={cn(
                "flex-1 gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-black hover:bg-white/20 rounded-lg shadow-lg px-8 py-4 text-lg font-semibold flex items-center justify-center",
                isOpen ? "opacity-100" : "opacity-100"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              <PlayIcon className="w-5 h-5" />
              How It Works
              {/* {isOpen && (
                <motion.div
                  className={cn(
                    buttonVariants({ variant: "iconButton", size: "icon" }),
                    "absolute -top-px -right-px aspect-square"
                  )}
                  initial={{ opacity: 0, scale: 0.8, rotate: -40 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    duration: DURATION,
                    ease: EASE_OUT,
                    delay: DELAY,
                  }}
                >
                  {/* <Cross1Icon className="size-5 text-primary-foreground" /> */}
                {/* </motion.div>  */}
              {/* )} */}
            </Button>
          </motion.div>

          {isOpen && (
            <motion.div
              key="how-it-works"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: DELAY,
                    duration: DURATION,
                    ease: EASE_OUT,
                  },
                },
                hidden: {
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: DURATION, ease: EASE_OUT },
                },
                exit: {
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: DURATION, ease: EASE_OUT_OPACITY },
                },
              }}
              className="relative flex min-h-0 flex-shrink overflow-hidden text-sm md:text-base max-h-[calc(70dvh-var(--footer-safe-area))] flex-col gap-8 text-center backdrop-blur-xl text-balance border-2 border-border/50 bg-primary/10 max-w-3xl text-foreground rounded-3xl ring-1 ring-offset-primary/10 ring-border/10 ring-offset-2 shadow-button"
            >
              <article className="relative overflow-y-auto p-6 h-full space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-secondary">1. Describe Your Vision</h3>
                  <p className="text-black/80">
                    Simply tell us what kind of podcast you want: "Create a weekly tech podcast with two AI hosts
                    discussing the latest breakthroughs in a casual, informative style."
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-secondary">2. AI Creates Characters</h3>
                  <p className="text-black/80">
                    Our AI generates unique personalities with distinct voices, viewpoints, and conversational styles
                    that bring your podcast to life.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-secondary">3. Auto-Generate Episodes</h3>
                  <p className="text-black/80">
                    Set your preferred schedule and watch as fresh, engaging episodes are automatically created with
                    up-to-date content and natural conversations.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-secondary">4. Listen & Share</h3>
                  <p className="text-black/80">
                    Enjoy high-quality audio output with lifelike speech patterns, or publish directly to major podcast
                    platforms.
                  </p>
                </div>
              </article>
            </motion.div>
          )}
        </AnimatePresenceGuard>
      </div>
    </div>
  )
}

const AnimatePresenceGuard = ({ children }: { children: React.ReactNode }) => {
  const isV0 = useIsV0()
  return isV0 ? (
    <>{children}</>
  ) : (
    <AnimatePresence mode="popLayout" propagate>
      {children}
    </AnimatePresence>
  )
}
