import { Button } from "@/components/ui/button"

export function ExploreMoreSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Explore more</h2>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <div className="mb-4 h-12 w-32 rounded-md bg-gray-100"></div>
          <h3 className="mb-1 font-medium">Speak to a specialist</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Get expert guidance as you get up and running with Intercom.
          </p>
          <Button variant="outline" size="sm">
            Talk to Product Specialist
          </Button>
        </div>

        <div className="rounded-lg border p-6">
          <div className="mb-4 h-12 w-32 rounded-md bg-gray-100"></div>
          <h3 className="mb-1 font-medium">Get the best from AI and Automation</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Learn how to use Workflows, Fin AI Agent, and Copilot to empower your team.
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <div className="mb-4 h-12 w-32 rounded-md bg-gray-100"></div>
          <h3 className="mb-1 font-medium">Improve your customer experience</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Learn to identify and track key metrics, to improve your customer experience.
          </p>
        </div>
      </div>
    </div>
  )
}

