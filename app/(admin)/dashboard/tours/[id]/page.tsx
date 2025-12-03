import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { getTourById } from "@/lib/actions/tour-actions"
import { getActiveLocations } from "@/lib/actions/location-actions"
import { prisma } from "@/lib/prisma"
import { TourDetailClient } from "./tour-detail-client"

interface TourDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Only supervisors and above can access tours
  if (user.role === "GUARD") {
    redirect("/")
  }

  // Fetch tour, locations, and guards
  const [tourResult, locationsResult] = await Promise.all([
    getTourById(id),
    getActiveLocations()
  ])

  if (!tourResult.ok) {
    notFound()
  }

  const tour = tourResult.data
  const locations = locationsResult.ok ? locationsResult.data : []

  // Fetch guards for guard evaluation stops
  const guards = await prisma.user.findMany({
    where: {
      role: "GUARD",
      archivedAt: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true
    },
    orderBy: [
      { firstName: "asc" },
      { lastName: "asc" }
    ]
  })

  return (
    <TourDetailClient
      user={user}
      tour={tour}
      locations={locations}
      guards={guards}
    />
  )
}
