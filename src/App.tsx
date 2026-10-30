import { FormEvent, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { HeroSkyCanvas, type SkyAnimationState } from "./HeroSkyCanvas"

gsap.registerPlugin(ScrollTrigger)

type PackageKey = "uk" | "india"
type Destination = {
  name: string
  category: string
  image: string
  eyebrow: string
  description: string
}

const packages = {
  uk: {
    label: "Created for travellers from the United Kingdom",
    name: "The Grand Ceylon Escape",
    duration: "12 days / 11 nights",
    price: "From £2,390 pp",
    note: "Sample price, based on two sharing",
    image: "/images/sigiriya.webp",
    intro:
      "A generous circuit through the Cultural Triangle, tea country and the southern coast—with time to settle into each place.",
    route: ["Colombo", "Sigiriya", "Kandy", "Ella", "Yala", "Galle"],
    stays:
      "Characterful boutique hotels, a tea-country bungalow and a restored Galle Fort residence.",
    transport:
      "Private air-conditioned car with an English-speaking chauffeur-guide; reserved hill-country train seats where available.",
    meals: "Daily breakfast, four dinners and two hosted lunches.",
    itinerary: [
      [
        "Day 1",
        "Arrive in Colombo",
        "Private airport welcome and an unhurried transfer to your garden hotel near Negombo.",
      ],
      [
        "Day 2",
        "Into the Cultural Triangle",
        "Drive inland through coconut country; pause at Dambulla’s cave temples before checking in near Sigiriya.",
      ],
      [
        "Day 3",
        "Sigiriya at first light",
        "Climb the rock fortress before the heat, then spend the afternoon cycling quiet village lanes.",
      ],
      [
        "Day 4",
        "Polonnaruwa & Minneriya",
        "Explore the ancient capital by bicycle, followed by an optional elephant safari timed to the season.",
      ],
      [
        "Day 5",
        "Kandy",
        "Travel south to Kandy, visiting a spice garden and the Temple of the Sacred Tooth at dusk.",
      ],
      [
        "Day 6",
        "Tea country",
        "Meet a small-scale tea producer, walk through the gardens and continue to your hillside bungalow.",
      ],
      [
        "Day 7",
        "The train to Ella",
        "Board the celebrated hill-country railway for a slow journey through cloud forest and tea estates.",
      ],
      [
        "Day 8",
        "Ella on foot",
        "Walk to Little Adam’s Peak and Nine Arches Bridge; the afternoon is deliberately free.",
      ],
      [
        "Day 9",
        "Yala wilderness",
        "Descend to the dry zone for a private late-afternoon game drive with a naturalist.",
      ],
      [
        "Day 10",
        "The southern coast",
        "Follow the coast to Galle, stopping for a swim and a seafood lunch by the water.",
      ],
      [
        "Day 11",
        "Galle Fort",
        "A historian-led walk through the fort, followed by a final evening at leisure.",
      ],
      [
        "Day 12",
        "Departure",
        "Private transfer to Colombo airport, timed to your onward flight.",
      ],
    ],
    included: [
      "11 nights accommodation",
      "Private chauffeur-guide",
      "Airport transfers",
      "Experiences listed",
      "Meals as specified",
    ],
    excluded: [
      "International flights",
      "Travel insurance",
      "Sri Lanka entry authorisation",
      "Optional activities",
      "Guide gratuities",
    ],
  },
  india: {
    label: "Created for travellers from India",
    name: "The Island Getaway",
    duration: "7 days / 6 nights",
    price: "From ₹1,18,000 pp",
    note: "Sample price, based on two sharing",
    image: "/images/ella.webp",
    intro:
      "A spirited week linking Sri Lanka’s ancient heart, green highlands and Indian Ocean—with short, well-paced travel days.",
    route: ["Colombo", "Sigiriya", "Kandy", "Nuwara Eliya", "Galle"],
    stays:
      "Design-led hotels, a modern hill-country retreat and a courtyard stay inside Galle Fort.",
    transport:
      "Private air-conditioned car with an English-speaking chauffeur-guide and an optional scenic train sector.",
    meals: "Daily breakfast, one traditional lunch and two dinners.",
    itinerary: [
      [
        "Day 1",
        "Colombo to Sigiriya",
        "Meet your chauffeur-guide at the airport and travel directly to the Cultural Triangle.",
      ],
      [
        "Day 2",
        "Sigiriya & village table",
        "Climb Sigiriya early, then share a hands-on village lunch cooked over a wood fire.",
      ],
      [
        "Day 3",
        "Kandy",
        "Continue via Dambulla to Kandy for a lakeside walk and evening temple visit.",
      ],
      [
        "Day 4",
        "Highland tea trails",
        "Wind into tea country, visit a working estate and stay among the cool, misty hills.",
      ],
      [
        "Day 5",
        "South to Galle",
        "A scenic drive to the coast with waterfall stops and time to settle into the fort.",
      ],
      [
        "Day 6",
        "Galle & the ocean",
        "Explore with a local host, then choose a beach afternoon or a cinnamon-estate visit.",
      ],
      [
        "Day 7",
        "Departure",
        "Private transfer to Colombo airport or extend your stay on the coast.",
      ],
    ],
    included: [
      "6 nights accommodation",
      "Private chauffeur-guide",
      "Airport transfers",
      "Experiences listed",
      "Meals as specified",
    ],
    excluded: [
      "Flights to Sri Lanka",
      "Travel insurance",
      "Sri Lanka entry authorisation",
      "Optional activities",
      "Guide gratuities",
    ],
  },
}

const destinations: Destination[] = [
  {
    name: "Sigiriya",
    category: "Culture",
    image: "/images/sigiriya.webp",
    eyebrow: "Ancient citadel",
    description:
      "Climb before breakfast, when the rock is cool and the gardens below are still quiet.",
  },
  {
    name: "Ella",
    category: "Highlands",
    image: "/images/ella.webp",
    eyebrow: "Tea-country trails",
    description:
      "Follow footpaths through tea fields, cloud forest and the arches of a century-old railway.",
  },
  {
    name: "Kandy",
    category: "Culture",
    image: "/images/kandy.webp",
    eyebrow: "Sacred city",
    description:
      "A compact hill city of temple rituals, botanical gardens and thoughtful contemporary craft.",
  },
  {
    name: "Galle",
    category: "Coast",
    image: "/images/galle.webp",
    eyebrow: "Fort & coast",
    description:
      "Walk the sea walls at golden hour, then disappear into the fort’s shaded lanes and courtyards.",
  },
  {
    name: "Mirissa",
    category: "Coast",
    image: "/images/mirissa.webp",
    eyebrow: "Southern shores",
    description:
      "A laid-back base for swimming, headland walks and seasonal whale-watching with responsible operators.",
  },
  {
    name: "Yala",
    category: "Wildlife",
    image: "/images/yala.webp",
    eyebrow: "Wild dry zone",
    description:
      "Explore scrub, lagoons and forest with a specialist naturalist—and no promise of staged sightings.",
  },
]

const Icon = ({
  name,
}: {
  name: "arrow" | "heart" | "close" | "menu" | "play" | "pause" | "check" | "download"
}) => {
  const paths: Record<string, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.4a5.5 5.5 0 0 0 1.1-8.9Z" />
    ),
    close: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: (
      <>
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function App() {
  const root = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const lenisRef = useRef<Lenis | null>(null)
  const skyStateRef = useRef<SkyAnimationState>({ progress: 0, paused: false })
  const [origin, setOrigin] = useState<PackageKey>("uk")
  const [filter, setFilter] = useState("All")
  const [saved, setSaved] = useState<string[]>([])
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState("")
  const [paused, setPaused] = useState(false)
  const [fullMotion, setFullMotion] = useState(true)
  const packageData = packages[origin]
  const visibleDestinations =
    filter === "All"
      ? destinations
      : destinations.filter((item) => item.category === filter)

  const playIntro = () => {
    if (!fullMotion || !root.current) return
    gsap.killTweensOf(".intro-animate")
    gsap
      .timeline()
      .fromTo(".hero-media", { scale: 1.08, autoAlpha: 0 }, {
        scale: 1,
        autoAlpha: 1,
        duration: 1.4,
        ease: "power3.out",
      })
      .fromTo(
        ".nav-animate",
        { y: -18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.65 },
        0.1,
      )
      .fromTo(
        ".hero-kicker",
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6 },
        0.25,
      )
      .fromTo(
        ".hero-word",
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.1, duration: 0.9, ease: "power4.out" },
        0.35,
      )
      .fromTo(
        ".hero-support",
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.7 },
        0.75,
      )
  }

  const scrollToTarget = (target: string | number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
    } else if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth" })
    } else {
      window.scrollTo({ top: target, behavior: "smooth" })
    }
  }

  useLayoutEffect(() => {
    if (!root.current) return

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.075,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      syncTouch: true,
      syncTouchLerp: 0.075,
    })
    lenisRef.current = lenis
    lenis.on("scroll", ScrollTrigger.update)

    const lenisTicker = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(lenisTicker)
    gsap.ticker.lagSmoothing(0)

    const onScrollTriggerRefresh = () => {
      lenis.resize()
    }
    ScrollTrigger.addEventListener("refresh", onScrollTriggerRefresh)

    let ctx: gsap.Context | undefined
    try {
      ctx = gsap.context(() => {
        gsap.set(".hero-media", { autoAlpha: 1 })
        if (!fullMotion) {
          gsap.set(".intro-animate, .reveal, .stagger-item", {
            clearProps: "all",
          })
          return
        }
        playIntro()
        skyStateRef.current.progress = 0

        let wasFlying = false
        let lastFlight = -1
        let portalMetrics: {
          originX: number
          originY: number
          deltaX: number
          deltaY: number
        } | null = null

        const contentEl = root.current?.querySelector<HTMLElement>(".hero-content")
        const oEl = root.current?.querySelector<HTMLElement>(".hero-portal-o")
        const headerEl = root.current?.querySelector<HTMLElement>(".site-header")
        const shadeEl = root.current?.querySelector<HTMLElement>(".hero-shade")
        const secondSectionEl = root.current?.querySelector<HTMLElement>(
          ".hero-second-section",
        )
        const supportEls = root.current?.querySelectorAll<HTMLElement>(
          ".hero-kicker, .hero-bottom, .replay, .hero-second-line",
        )

        const measurePortalO = () => {
          if (!contentEl || !oEl) return
          gsap.set(contentEl, { x: 0, y: 0, scale: 1, rotation: 0 })
          const contentRect = contentEl.getBoundingClientRect()
          const oRect = oEl.getBoundingClientRect()
          // Optical center of the inner oval counter (hole) of lowercase 'o'
          const oCenterX = oRect.left + oRect.width * 0.5
          const oCenterY = oRect.top + oRect.height * 0.53
          const originX = oCenterX - contentRect.left
          const originY = oCenterY - contentRect.top
          // Align the 'o' portal directly with Sigiriya Rock's summit (49.5% X, 43.5% Y)
          const targetX = window.innerWidth * 0.495
          const targetY = window.innerHeight * 0.435
          portalMetrics = {
            originX,
            originY,
            deltaX: targetX - oCenterX,
            deltaY: targetY - oCenterY,
          }
          gsap.set(contentEl, {
            transformOrigin: `${originX}px ${originY}px`,
          })
        }

        skyStateRef.current.onFlightTick = (flightProgress: number) => {
          if (!contentEl) return
          if (Math.abs(flightProgress - lastFlight) < 0.0002 && flightProgress > 0.0005) {
            return
          }
          lastFlight = flightProgress

          if (flightProgress <= 0.0005) {
            if (wasFlying) {
              wasFlying = false
              gsap.set(contentEl, {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                autoAlpha: 1,
              })
              if (headerEl) gsap.set(headerEl, { autoAlpha: 1 })
              if (supportEls?.length) gsap.set(supportEls, { autoAlpha: 1 })
              if (shadeEl) gsap.set(shadeEl, { autoAlpha: 1 })
              if (secondSectionEl) {
                gsap.set(secondSectionEl, {
                  autoAlpha: 0,
                  y: 44,
                  pointerEvents: "none",
                })
              }
            }
            return
          }

          if (!wasFlying || !portalMetrics) {
            measurePortalO()
            wasFlying = true
          }
          if (!portalMetrics) return

          // Portal fly-through completes across the first 45% of the drone flight
          const portalT = Math.min(1, flightProgress / 0.45)
          const alignRaw = Math.min(1, portalT / 0.32)
          const alignEase = alignRaw * alignRaw * (3 - 2 * alignRaw)

          // Exponential zoom through the inner counter of the letter "o"
          const scale = 1 + Math.pow(portalT, 2.35) * 115
          const bankDeg = Math.sin(portalT * Math.PI) * -4.2

          const supportAlpha = Math.max(0, 1 - flightProgress / 0.14)
          const initialShadeAlpha = Math.max(0, 1 - flightProgress / 0.32)
          const contentAlpha =
            portalT < 0.54 ? 1 : Math.max(0, 1 - (portalT - 0.54) / 0.42)

          // After passing through the letter "o" into the Ella image, reveal the second section on the hero area
          const secondRaw = Math.max(
            0,
            Math.min(1, (flightProgress - 0.48) / 0.30),
          )
          const secondEase = secondRaw * secondRaw * (3 - 2 * secondRaw)
          const headerAlpha = Math.max(supportAlpha, secondEase)
          const shadeAlpha = Math.max(initialShadeAlpha, secondEase * 0.92)

          gsap.set(contentEl, {
            x: portalMetrics.deltaX * alignEase,
            y: portalMetrics.deltaY * alignEase,
            scale,
            rotation: bankDeg,
            autoAlpha: contentAlpha,
          })
          if (headerEl) gsap.set(headerEl, { autoAlpha: headerAlpha })
          if (supportEls?.length) gsap.set(supportEls, { autoAlpha: supportAlpha })
          if (shadeEl) gsap.set(shadeEl, { autoAlpha: shadeAlpha })
          if (secondSectionEl) {
            gsap.set(secondSectionEl, {
              autoAlpha: secondEase,
              y: (1 - secondEase) * 44,
              pointerEvents: secondEase > 0.15 ? "auto" : "none",
            })
          }
        }

        gsap.set(".hero-second-section", {
          autoAlpha: 0,
          y: 44,
          pointerEvents: "none",
        })

        gsap.fromTo(
          ".hero-angle-track",
          { xPercent: 0 },
          {
            xPercent: -50,
            duration: 14,
            ease: "none",
            repeat: -1,
          },
        )

        ScrollTrigger.create({
          trigger: ".hero",
          start: "top top",
          end: "+=4400",
          pin: true,
          pinSpacing: true,
          onRefresh: () => {
            portalMetrics = null
            if (wasFlying) {
              measurePortalO()
            }
          },
          onUpdate: (self) => {
            skyStateRef.current.progress = Math.max(0, Math.min(1, self.progress))
          },
          onLeave: () => {
            skyStateRef.current.progress = 1
          },
          onLeaveBack: () => {
            skyStateRef.current.progress = 0
          },
        })
        // 1. Editorial section headings & general reveal blocks
        gsap.utils
          .toArray<HTMLElement>(".reveal:not(.essentials-grid details)")
          .forEach((element) => {
            gsap.fromTo(
              element,
              { y: 44, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 86%",
                  toggleActions: "play none none reverse",
                },
              },
            )
          })

        // 2. Parallax media across sections (locked 1:1 to Lenis inertia)
        gsap.utils
          .toArray<HTMLElement>("[data-parallax]")
          .forEach((element) => {
            gsap.fromTo(
              element,
              { yPercent: -6, scale: 1.05 },
              {
                yPercent: 6,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: element.parentElement,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            )
          })

        // 3. Journeys section: 3-column detail panels & included/excluded checklists
        gsap.fromTo(
          ".details-grid .detail-panel",
          { y: 52, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.14,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".details-grid",
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        )

        gsap.fromTo(
          ".included > div:not(:first-child) p",
          { x: 24, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            stagger: 0.06,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".included",
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        )

        // 4. Places section: filter buttons stagger
        gsap.fromTo(
          ".filters button",
          { y: 18, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.06,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".filters",
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        )

        // 5. Care section: GPU-composited image expansion & 4 care pillars stagger
        gsap.fromTo(
          ".care-image",
          { scale: 0.95 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".care-image",
              start: "top 85%",
              end: "top 25%",
              scrub: true,
            },
          },
        )

        gsap.fromTo(
          ".care-list > div",
          { y: 42, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".care-list",
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        )

        // 6. Comparison table: row-by-row cascade
        gsap.fromTo(
          ".comparison-head, .comparison-row",
          { y: 26, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.09,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".comparison-table",
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        )

        // 7. Travel essentials: staggered two-column accordion cards
        gsap.fromTo(
          ".essentials-grid details",
          { y: 34, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.08,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".essentials-grid",
              start: "top 84%",
              toggleActions: "play none none reverse",
            },
          },
        )

        // 8. Closing section: scrubbed background zoom & staggered callout
        gsap.fromTo(
          ".closing > img",
          { scale: 1.14, yPercent: -5 },
          {
            scale: 1,
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: ".closing",
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        )

        gsap.fromTo(
          ".closing-inner > *",
          { y: 36, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.12,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".closing",
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          },
        )

        // 9. Footer entrance
        gsap.fromTo(
          "footer .footer-top > *, footer .footer-bottom",
          { y: 26, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: {
              trigger: "footer",
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        )
      }, root)
      const refresh = () => ScrollTrigger.refresh()
      window.addEventListener("load", refresh)
      document.fonts?.ready.then(refresh)
      const onPageShow = () => {
        gsap.globalTimeline.resume()
        ScrollTrigger.refresh()
      }
      const onVisibility = () =>
        document.hidden
          ? gsap.globalTimeline.pause()
          : !pausedRef.current && gsap.globalTimeline.resume()
      window.addEventListener("pageshow", onPageShow)
      document.addEventListener("visibilitychange", onVisibility)
      const timer = window.setTimeout(refresh, 350)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener("load", refresh)
        window.removeEventListener("pageshow", onPageShow)
        document.removeEventListener("visibilitychange", onVisibility)
        ScrollTrigger.removeEventListener("refresh", onScrollTriggerRefresh)
        gsap.ticker.remove(lenisTicker)
        lenis.destroy()
        lenisRef.current = null
        ctx?.revert()
      }
    } catch (error) {
      console.error("Ceylon Trails motion could not initialise:", error)
      root.current?.classList.add("motion-failed")
    }
  }, [fullMotion])

  useLayoutEffect(() => {
    if (!fullMotion || !root.current) return
    const ctx = gsap.context(() => {
      // Featured package card & copy stagger on scroll / package switch
      gsap.fromTo(
        ".featured-package",
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".featured-package",
            start: "top 84%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.fromTo(
        ".package-copy > *",
        { y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          stagger: 0.07,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".featured-package",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      )

      // Day-by-day itinerary list items stagger on scroll / package switch
      gsap.fromTo(
        ".itinerary-day",
        { y: 30, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          stagger: 0.08,
          duration: 0.65,
          ease: "power2.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: ".itinerary-list",
            start: "top 84%",
            toggleActions: "play none none reverse",
          },
        },
      )

      // Route section numbered stops, island silhouette, SVG route line draw & markers
      gsap.fromTo(
        ".route-copy ol li",
        { x: -22, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".route-section",
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.fromTo(
        ".map-wrap .island",
        { scale: 0.92, autoAlpha: 0, transformOrigin: "center" },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".map-wrap",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.fromTo(
        ".route-line",
        { strokeDasharray: 1000, strokeDashoffset: 1000 },
        {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".map-wrap",
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        },
      )

      gsap.fromTo(
        ".route-marker",
        { scale: 0, transformOrigin: "center" },
        {
          scale: 1,
          stagger: 0.14,
          duration: 0.45,
          ease: "back.out(1.8)",
          scrollTrigger: {
            trigger: ".map-wrap",
            start: "top 76%",
            toggleActions: "play none none reverse",
          },
        },
      )

      // Destination grid cards stagger on scroll / category filter change
      gsap.fromTo(
        ".destination-card",
        { y: 46, scale: 0.97, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          stagger: 0.09,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: {
            trigger: ".destination-grid",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      )

      window.setTimeout(() => ScrollTrigger.refresh(), 100)
    }, root)
    return () => ctx.revert()
  }, [filter, origin, fullMotion])

  useLayoutEffect(() => {
    if (!fullMotion || (!selectedDestination && !enquiryOpen)) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".dialog-backdrop", { autoAlpha: 0 }, {
        autoAlpha: 1,
        duration: 0.22,
      })
      gsap.fromTo(
        ".destination-dialog, .enquiry-dialog",
        { y: 28, scale: 0.98, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
      )
      gsap.fromTo(
        ".enquiry-dialog form, .step-two, .success-panel",
        { x: 18, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.38, ease: "power2.out" },
      )
    }, root)
    return () => ctx.revert()
  }, [selectedDestination, enquiryOpen, step, submitted, fullMotion])

  const togglePause = () => {
    const next = !paused
    setPaused(next)
    pausedRef.current = next
    skyStateRef.current.paused = next
    if (next) {
      lenisRef.current?.stop()
      gsap.globalTimeline.pause()
      ScrollTrigger.getAll().forEach((trigger) => trigger.disable(false))
    } else {
      lenisRef.current?.start()
      gsap.globalTimeline.resume()
      ScrollTrigger.getAll().forEach((trigger) => trigger.enable())
      ScrollTrigger.refresh()
    }
  }

  const toggleFavourite = (name: string, event?: React.MouseEvent) => {
    event?.stopPropagation()
    setSaved((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    )
    if (fullMotion && event?.currentTarget) {
      gsap.fromTo(event.currentTarget, { scale: 0.7 }, {
        scale: 1,
        duration: 0.45,
        ease: "back.out(2)",
      })
    }
  }

  const handleStep = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!data.get("name") || !data.get("email")) {
      setFormError("Please add your name and email before continuing.")
      return
    }
    setFormError("")
    setStep(2)
  }

  const downloadEnquiry = () => {
    const content = `CEYLON TRAILS — ENQUIRY SUMMARY\n\nPackage: ${packageData.name}\nDuration: ${packageData.duration}\nOrigin: ${
      origin === "uk" ? "United Kingdom" : "India"
    }\nSample price: ${packageData.price}\n\nThis is an enquiry summary only. No booking or payment has been processed.`
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "ceylon-trails-enquiry.txt"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      ref={root}
      className={`site ${fullMotion ? "motion-on" : "motion-off"}`}
    >
      <main id="top">
        <section className="hero">
          <header className="site-header">
            <a
              className="brand nav-animate"
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                scrollToTarget(0)
              }}
              aria-label="Ceylon Trails home"
            >
              <span className="brand-mark">CT</span>
              <span>
                <strong>Ceylon Trails</strong>
                <small>Journeys across Sri Lanka</small>
              </span>
            </a>
            <button
              className="icon-button menu-button nav-animate"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Open navigation"
            >
              <Icon name="menu" />
            </button>
            <nav
              className={mobileNav ? "nav-open" : ""}
              aria-label="Main navigation"
            >
              <a
                className="nav-animate"
                href="#journeys"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileNav(false)
                  scrollToTarget("#journeys")
                }}
              >
                Journeys
              </a>
              <a
                className="nav-animate"
                href="#places"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileNav(false)
                  scrollToTarget("#places")
                }}
              >
                Places
              </a>
              <a
                className="nav-animate"
                href="#essentials"
                onClick={(e) => {
                  e.preventDefault()
                  setMobileNav(false)
                  scrollToTarget("#essentials")
                }}
              >
                Travel notes
              </a>
            </nav>
            <div className="header-actions">
              <label className="origin-select nav-animate">
                Travelling from
                <select
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value as PackageKey)}
                >
                  <option value="uk">United Kingdom</option>
                  <option value="india">India</option>
                </select>
              </label>
              <button
                className="saved-button nav-animate"
                onClick={() => scrollToTarget("#places")}
              >
                <Icon name="heart" /> Saved <span>{saved.length}</span>
              </button>
              <button
                className="button button-dark nav-animate"
                onClick={() => {
                  setEnquiryOpen(true)
                  setStep(1)
                  setSubmitted(false)
                }}
              >
                Plan my trip
              </button>
            </div>
          </header>

          <div className="hero-media intro-animate">
            <img
              src="/images/sigiriya.webp"
              alt="Sigiriya rock fortress rising above Sri Lanka's forest"
            />
            <HeroSkyCanvas stateRef={skyStateRef} />
          </div>
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow hero-kicker intro-animate">
              Private journeys · Sri Lanka
            </p>
            <h1 aria-label="Go slowly. See deeply.">
              <span className="hero-first-line">
                <span className="hero-word intro-animate">
                  G<span className="hero-portal-o">o</span> slowly.
                </span>
              </span>
              <span className="hero-second-line">
                <span className="hero-word intro-animate">
                  <em>See deeply.</em>
                </span>
              </span>
            </h1>
            <div className="hero-bottom">
              <p className="hero-support intro-animate">
                Thoughtful, private journeys between ancient cities, tea-covered
                hills and the Indian Ocean.
              </p>
              <a
                className="button button-lime hero-support intro-animate"
                href="#journeys"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget("#journeys")
                }}
              >
                Explore the journeys <Icon name="arrow" />
              </a>
            </div>
          </div>

          <div className="hero-second-section">
            <div className="intro-section section-shell hero-intro-overlay">
              <p className="vertical-note">18 years of local knowledge</p>
              <div className="section-heading">
                <p className="eyebrow">An island worth lingering over</p>
                <h2>
                  Sri Lanka, <em>at your pace.</em>
                </h2>
              </div>
              <div className="intro-grid">
                <p className="lead">
                  A small island can hold an astonishing number of worlds. We
                  connect them with good guides, considered stays and room to
                  change course.
                </p>
                <p>
                  These are illustrative arrangements, shaped as a starting
                  point—not a rigid group tour. Tell us how you like to travel
                  and we’ll refine the rhythm around you.
                </p>
              </div>
            </div>

            <div className="hero-angle-strap-wrap" aria-label="Travel accolades and certifications">
              <div className="hero-angle-strap">
                <div className="hero-angle-track">
                  {[0, 1].map((copyIndex) => (
                    <div
                      className="hero-angle-group"
                      key={copyIndex}
                      aria-hidden={copyIndex === 1}
                    >
                      <div className="strap-badge">
                        <span className="strap-badge-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <circle cx="7.5" cy="13.5" r="3.5" />
                            <circle cx="16.5" cy="13.5" r="3.5" />
                            <circle cx="7.5" cy="13.5" r="1.2" fill="currentColor" />
                            <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" />
                            <path d="M12 17l-1.8-2.2h3.6L12 17z" fill="currentColor" />
                            <path d="M4 10c2.2-2.4 5-3.5 8-3.5s5.8 1.1 8 3.5" />
                          </svg>
                        </span>
                        <span className="strap-badge-text">
                          <strong>Tripadvisor</strong>
                          <small>Travellers’ Choice · 5.0 ★</small>
                        </span>
                      </div>

                      <span className="strap-Dot" aria-hidden="true">✦</span>

                      <div className="strap-badge">
                        <span className="strap-badge-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 2l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 15.5l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 2z" />
                          </svg>
                        </span>
                        <span className="strap-badge-text">
                          <strong>Condé Nast Traveler</strong>
                          <small>Gold List Specialist</small>
                        </span>
                      </div>

                      <span className="strap-Dot" aria-hidden="true">✦</span>

                      <div className="strap-badge">
                        <span className="strap-badge-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                        </span>
                        <span className="strap-badge-text">
                          <strong>ABTA &amp; ATOL Protected</strong>
                          <small>100% Financial Security</small>
                        </span>
                      </div>

                      <span className="strap-Dot" aria-hidden="true">✦</span>

                      <div className="strap-badge">
                        <span className="strap-badge-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <circle cx="12" cy="12" r="9" />
                            <polygon points="14.8,9.2 13,13 9.2,14.8 11,11" fill="currentColor" />
                          </svg>
                        </span>
                        <span className="strap-badge-text">
                          <strong>Lonely Planet</strong>
                          <small>Best in Travel · Sri Lanka</small>
                        </span>
                      </div>

                      <span className="strap-Dot" aria-hidden="true">✦</span>

                      <div className="strap-badge">
                        <span className="strap-badge-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                            <path d="M4 22h16" />
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                          </svg>
                        </span>
                        <span className="strap-badge-text">
                          <strong>Travel + Leisure</strong>
                          <small>World’s Best Awards</small>
                        </span>
                      </div>

                      <span className="strap-Dot" aria-hidden="true">✦</span>

                      <div className="strap-badge">
                        <span className="strap-badge-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 3l2.3 4.7 5.2.7-3.8 3.7.9 5.2L12 14.8l-4.6 2.5.9-5.2-3.8-3.7 5.2-.7L12 3z" />
                          </svg>
                        </span>
                        <span className="strap-badge-text">
                          <strong>Trustpilot</strong>
                          <small>4.9 / 5 · Bespoke Private Tours</small>
                        </span>
                      </div>

                      <span className="strap-Dot" aria-hidden="true">✦</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            className="replay hero-support intro-animate"
            onClick={playIntro}
          >
            <Icon name="play" /> Replay intro
          </button>
        </section>

        <section id="journeys" className="journey-section">
          <div className="section-shell">
            <div className="section-top reveal">
              <div>
                <p className="eyebrow">Two ways across the island</p>
                <h2>
                  Choose your <em>journey.</em>
                </h2>
              </div>
              <div
                className="package-switch"
                role="tablist"
                aria-label="Choose package"
              >
                <button
                  role="tab"
                  aria-selected={origin === "uk"}
                  onClick={() => setOrigin("uk")}
                >
                  From the UK
                </button>
                <button
                  role="tab"
                  aria-selected={origin === "india"}
                  onClick={() => setOrigin("india")}
                >
                  From India
                </button>
              </div>
            </div>
            <article className="featured-package dynamic-card">
              <div className="package-image">
                <img src={packageData.image} alt="" data-parallax />
              </div>
              <div className="package-copy">
                <p className="eyebrow">{packageData.label}</p>
                <h3>{packageData.name}</h3>
                <p className="package-duration">{packageData.duration}</p>
                <p>{packageData.intro}</p>
                <div className="price">
                  <strong>{packageData.price}</strong>
                  <span>{packageData.note}</span>
                </div>
                <button
                  className="button button-lime"
                  onClick={() => {
                    setEnquiryOpen(true)
                    setStep(1)
                    setSubmitted(false)
                  }}
                >
                  Enquire about this journey <Icon name="arrow" />
                </button>
              </div>
            </article>
          </div>

          <div className="itinerary-shell section-shell">
            <div className="itinerary-intro reveal">
              <p className="eyebrow">Day by day</p>
              <h2>
                A considered <em>rhythm.</em>
              </h2>
              <p>
                Each day has a clear intention, but there is space to stop for a
                roadside tea, a market, or simply the view.
              </p>
            </div>
            <div className="itinerary-list">
              {packageData.itinerary.map(([day, title, text]) => (
                <details
                  className="itinerary-day dynamic-card"
                  key={day}
                  open={day === "Day 1"}
                >
                  <summary>
                    <span>{day}</span>
                    <strong>{title}</strong>
                    <i>+</i>
                  </summary>
                  <p>{text}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="details-grid section-shell">
            <div className="detail-panel reveal">
              <span className="detail-number">01</span>
              <h3>Where you stay</h3>
              <p>{packageData.stays}</p>
            </div>
            <div className="detail-panel reveal">
              <span className="detail-number">02</span>
              <h3>How you travel</h3>
              <p>{packageData.transport}</p>
            </div>
            <div className="detail-panel reveal">
              <span className="detail-number">03</span>
              <h3>At the table</h3>
              <p>{packageData.meals}</p>
            </div>
          </div>

          <div className="included section-shell reveal">
            <div>
              <p className="eyebrow">What is covered</p>
              <h2>
                Clear from the <em>outset.</em>
              </h2>
            </div>
            <div>
              <h3>Included</h3>
              {packageData.included.map((item) => (
                <p key={item}>
                  <Icon name="check" />
                  {item}
                </p>
              ))}
            </div>
            <div>
              <h3>Not included</h3>
              {packageData.excluded.map((item) => (
                <p key={item}>
                  <span>—</span>
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="route-section">
          <div className="section-shell route-grid">
            <div className="route-copy reveal">
              <p className="eyebrow">The route</p>
              <h2>
                See how the journey <em>unfolds.</em>
              </h2>
              <p>
                {origin === "uk"
                  ? "A full island arc from the ancient north to the southern ramparts."
                  : "A compact route through the cultural heart and cool central hills to the coast."}
              </p>
              <ol>
                {packageData.route.map((place, index) => (
                  <li key={place}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {place}
                  </li>
                ))}
              </ol>
            </div>
            <div
              className="map-wrap dynamic-card"
              aria-label={`Illustrated route map for ${packageData.name}`}
            >
              <svg viewBox="0 0 430 620" role="img">
                <path
                  className="island"
                  d="M229 27c-44 13-68 60-91 105-25 48-54 101-70 157-18 63-15 127 14 186 22 43 59 91 105 113 38 18 76-1 100-33 37-50 57-117 64-180 8-74-16-135-44-198-25-57-31-112-78-150Z"
                />
                <path
                  className="route-line"
                  d={
                    origin === "uk"
                      ? "M155 175 C235 125 287 178 229 258 S168 328 225 369 S287 422 206 512"
                      : "M145 160 C235 132 287 202 221 271 S178 339 210 391 S246 462 198 521"
                  }
                />
                {packageData.route.map((place, index) => {
                  const ukPoints = [
                    [147, 169],
                    [247, 159],
                    [225, 269],
                    [184, 340],
                    [262, 413],
                    [203, 515],
                  ]
                  const inPoints = [
                    [143, 158],
                    [244, 160],
                    [224, 271],
                    [180, 350],
                    [199, 520],
                  ]
                  const point = (origin === "uk" ? ukPoints : inPoints)[index]
                  return (
                    <g
                      className="route-marker"
                      key={place}
                      transform={`translate(${point[0]} ${point[1]})`}
                    >
                      <circle r="8" />
                      <text x="14" y="5">
                        {place}
                      </text>
                    </g>
                  )
                })}
              </svg>
              <span className="map-label">
                Illustrative route · not to scale
              </span>
            </div>
          </div>
        </section>

        <section id="places" className="places-section section-shell">
          <div className="section-top reveal">
            <div>
              <p className="eyebrow">Find your place</p>
              <h2>
                Six distinct <em>landscapes.</em>
              </h2>
            </div>
            <p className="section-aside">
              Save the places that catch your eye. We’ll include them in your
              enquiry summary.
            </p>
          </div>
          <div
            className="filters reveal"
            role="group"
            aria-label="Filter destinations"
          >
            {["All", "Culture", "Highlands", "Coast", "Wildlife"].map(
              (item) => (
                <button
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                  key={item}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="destination-grid">
            {visibleDestinations.map((destination) => (
              <article
                className="destination-card dynamic-card"
                key={destination.name}
                onClick={() => setSelectedDestination(destination)}
              >
                <div className="destination-image">
                  <img
                    src={destination.image}
                    alt={`${destination.name}, Sri Lanka`}
                  />
                  <button
                    className={
                      saved.includes(destination.name)
                        ? "favourite saved"
                        : "favourite"
                    }
                    onClick={(event) =>
                      toggleFavourite(destination.name, event)
                    }
                    aria-label={`${
                      saved.includes(destination.name) ? "Remove" : "Save"
                    } ${destination.name}`}
                  >
                    <Icon name="heart" />
                  </button>
                </div>
                <div className="destination-copy">
                  <p className="eyebrow">{destination.eyebrow}</p>
                  <h3>{destination.name}</h3>
                  <button>
                    Discover the place <Icon name="arrow" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="care-section">
          <div className="care-image reveal">
            <img
              src="/images/kandy.webp"
              alt="Sri Lanka's green tea country"
              data-parallax
            />
          </div>
          <div className="care-copy section-shell reveal">
            <p className="eyebrow">Travel, well looked after</p>
            <h2>
              Private by design. <em>Personal by nature.</em>
            </h2>
            <div className="care-list">
              <div>
                <span>01</span>
                <h3>Your own local guide</h3>
                <p>
                  A dedicated chauffeur-guide throughout, with specialist hosts
                  where their knowledge matters.
                </p>
              </div>
              <div>
                <span>02</span>
                <h3>Airport to hotel</h3>
                <p>
                  Private arrival and departure transfers, coordinated around
                  your actual flight times.
                </p>
              </div>
              <div>
                <span>03</span>
                <h3>Room to adapt</h3>
                <p>
                  Swap a walk, slow the pace or add a night. These itineraries
                  are flexible starting points.
                </p>
              </div>
              <div>
                <span>04</span>
                <h3>Food that fits</h3>
                <p>
                  Vegetarian, Jain, vegan, halal and allergy-aware arrangements
                  discussed before you travel.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="comparison section-shell">
          <div className="section-heading reveal">
            <p className="eyebrow">At a glance</p>
            <h2>
              Compare the <em>journeys.</em>
            </h2>
          </div>
          <div className="comparison-table reveal">
            <div className="comparison-head">
              <span></span>
              <strong>The Grand Ceylon Escape</strong>
              <strong>The Island Getaway</strong>
            </div>
            {[
              ["Designed for", "UK departures", "India departures"],
              ["Duration", "12 days / 11 nights", "7 days / 6 nights"],
              ["Pace", "Leisurely, in-depth", "Lively, well-paced"],
              [
                "Route",
                "Culture, hills, wildlife, coast",
                "Culture, hills and coast",
              ],
              ["Sample price", "From £2,390 pp", "From ₹1,18,000 pp"],
            ].map((row) => (
              <div className="comparison-row" key={row[0]}>
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="essentials" className="essentials-section">
          <div className="section-shell">
            <div className="section-heading reveal">
              <p className="eyebrow">Before you leave</p>
              <h2>
                Travel <em>essentials.</em>
              </h2>
            </div>
            <div className="essentials-grid">
              <details className="reveal" open>
                <summary>
                  Entry requirements <i>+</i>
                </summary>
                <p>
                  Requirements can change. Check the{" "}
                  <a
                    href="https://www.gov.uk/foreign-travel-advice/sri-lanka/entry-requirements"
                    target="_blank"
                    rel="noreferrer"
                  >
                    UK Government travel advice
                  </a>
                  , the{" "}
                  <a
                    href="https://www.immigration.gov.lk/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sri Lanka Department of Immigration
                  </a>
                  , and guidance from your airline before travel.
                </p>
              </details>
              <details className="reveal">
                <summary>
                  What to pack <i>+</i>
                </summary>
                <p>
                  Light breathable layers, a rain shell, sun protection and
                  shoes with grip. Add a warmer layer for the central highlands
                  and modest clothing for temple visits.
                </p>
              </details>
              <details className="reveal">
                <summary>
                  Cultural etiquette <i>+</i>
                </summary>
                <p>
                  Cover shoulders and knees at religious sites, remove shoes and
                  hats where requested, and never pose with your back to a
                  Buddha image. Ask before photographing people.
                </p>
              </details>
              <details className="reveal">
                <summary>
                  When should I travel? <i>+</i>
                </summary>
                <p>
                  Sri Lanka’s weather varies by coast and elevation. Rather than
                  promising one “best” month, we’ll shape the route around
                  regional conditions and what you most want to do.
                </p>
              </details>
              <details className="reveal">
                <summary>
                  Can the itinerary change? <i>+</i>
                </summary>
                <p>
                  Yes. Add nights, change hotel style, slow the travel days or
                  focus on food, wildlife, walking or coast. Availability and
                  seasonal conditions still apply.
                </p>
              </details>
              <details className="reveal">
                <summary>
                  Is this a confirmed booking? <i>+</i>
                </summary>
                <p>
                  No. All prices and arrangements shown are illustrative. An
                  enquiry starts a conversation; it does not confirm services or
                  process payment.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="closing">
          <img src="/images/galle.webp" alt="" />
          <div className="closing-shade" />
          <div className="closing-inner">
            <p className="eyebrow">Your island story begins here</p>
            <h2>
              Come for the places.
              <br />
              <em>Leave with the feeling.</em>
            </h2>
            <button
              className="button button-lime"
              onClick={() => {
                setEnquiryOpen(true)
                setStep(1)
                setSubmitted(false)
              }}
            >
              Plan my trip <Icon name="arrow" />
            </button>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-top">
          <a className="brand" href="#top">
            <span className="brand-mark">CT</span>
            <span>
              <strong>Ceylon Trails</strong>
              <small>Journeys across Sri Lanka</small>
            </span>
          </a>
          <p>
            Small, considered journeys through Sri Lanka—designed around how you
            want to travel.
          </p>
          <button
            className="button button-outline"
            onClick={() => setEnquiryOpen(true)}
          >
            Start an enquiry <Icon name="arrow" />
          </button>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Ceylon Trails. Concept travel guide.
          </p>
          <p>
            <a href="#privacy">Privacy</a> · Photos: Shashank Hudkar, Hendrik
            Cornelissen, Jerry Kavan, Daniel Klein, Dinuka Lankaloka and Tom
            Paisley / Unsplash
          </p>
          <div className="motion-controls" aria-label="Motion controls">
            <span>
              Motion: {fullMotion ? (paused ? "paused" : "full") : "reduced"}
            </span>
            <button onClick={togglePause} disabled={!fullMotion}>
              <Icon name={paused ? "play" : "pause"} />{" "}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={() => {
                setFullMotion(true)
                setPaused(false)
                pausedRef.current = false
                skyStateRef.current.paused = false
                gsap.globalTimeline.resume()
              }}
            >
              Enable full motion
            </button>
            <button onClick={playIntro} disabled={!fullMotion}>
              Replay intro
            </button>
          </div>
        </div>
        <p id="privacy" className="privacy">
          Privacy note: this frontend demo does not transmit or store your
          enquiry. Downloaded summaries are created locally in your browser.
        </p>
      </footer>

      {selectedDestination && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedDestination(null)}
        >
          <div
            className="destination-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destination-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close"
              onClick={() => setSelectedDestination(null)}
              aria-label="Close destination"
            >
              <Icon name="close" />
            </button>
            <img src={selectedDestination.image} alt="" />
            <div>
              <p className="eyebrow">{selectedDestination.eyebrow}</p>
              <h2 id="destination-title">{selectedDestination.name}</h2>
              <p>{selectedDestination.description}</p>
              <button
                className="button button-dark"
                onClick={(event) =>
                  toggleFavourite(selectedDestination.name, event)
                }
              >
                {saved.includes(selectedDestination.name)
                  ? "Saved to your trip"
                  : "Save this place"}{" "}
                <Icon name="heart" />
              </button>
            </div>
          </div>
        </div>
      )}

      {enquiryOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setEnquiryOpen(false)}
        >
          <div
            className="enquiry-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close"
              onClick={() => setEnquiryOpen(false)}
              aria-label="Close enquiry"
            >
              <Icon name="close" />
            </button>
            <div className="step-indicator">
              <span className={step >= 1 ? "active" : ""}>1</span>
              <i />
              <span className={step >= 2 ? "active" : ""}>2</span>
            </div>
            {!submitted && step === 1 && (
              <form onSubmit={handleStep}>
                <p className="eyebrow">Step 1 of 2</p>
                <h2 id="enquiry-title">
                  Tell us about <em>you.</em>
                </h2>
                <div className="form-grid">
                  <label>
                    Full name
                    <input name="name" autoFocus />
                  </label>
                  <label>
                    Email address
                    <input name="email" type="email" />
                  </label>
                  <label>
                    Phone (optional)
                    <input name="phone" type="tel" />
                  </label>
                  <label>
                    Preferred month
                    <input name="month" type="month" />
                  </label>
                </div>
                {formError && (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                )}
                <button className="button button-dark" type="submit">
                  Continue to trip <Icon name="arrow" />
                </button>
              </form>
            )}
            {!submitted && step === 2 && (
              <div className="step-two">
                <p className="eyebrow">Step 2 of 2</p>
                <h2>
                  Review your <em>idea.</em>
                </h2>
                <div className="trip-summary">
                  <span>Selected journey</span>
                  <h3>{packageData.name}</h3>
                  <p>
                    {packageData.duration} · {packageData.price}
                  </p>
                  <p>
                    {saved.length
                      ? `Saved places: ${saved.join(", ")}`
                      : "No additional places saved yet."}
                  </p>
                  <small>Illustrative arrangement and sample price only.</small>
                </div>
                <label className="message-label">
                  Anything we should know?
                  <textarea placeholder="Interests, dietary preferences, pace or accessibility needs…" />
                </label>
                <div className="form-actions">
                  <button
                    className="button button-outline-dark"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="button button-dark"
                    onClick={() => setSubmitted(true)}
                  >
                    Create enquiry summary <Icon name="arrow" />
                  </button>
                </div>
              </div>
            )}
            {submitted && (
              <div className="success-panel">
                <span className="success-icon">
                  <Icon name="check" />
                </span>
                <p className="eyebrow">Summary ready</p>
                <h2>
                  Your trip idea is <em>ready.</em>
                </h2>
                <p>
                  Nothing has been sent, booked or paid for. Download the
                  summary and share it with a travel planner when you are ready.
                </p>
                <button
                  className="button button-dark"
                  onClick={downloadEnquiry}
                >
                  Download enquiry <Icon name="download" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
