import { Button } from "@/components/ui/button"
import { Circle, CheckCircle2 } from "lucide-react"

export function GetStartedSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
        <span>Get set up</span>
        <span className="text-xs">•</span>
        <span>0 / 3 steps</span>
      </div>

      <div className="rounded-lg border">
        <div className="space-y-6 p-6">
          <div className="flex items-start gap-4">
            <Circle className="mt-1 h-5 w-5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">Set up channels to connect with your customers</h3>
              <p className="text-sm text-muted-foreground">
                Manage conversations across all channels: Messenger, email, phone, WhatsApp, SMS, and social. Support
                your customers wherever they are, directly from your Intercom Inbox.
              </p>
              <Button variant="default" size="sm" className="mt-2">
                Set up channels
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="h-32 w-48 rounded-md bg-gray-100"></div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Circle className="mt-1 h-5 w-5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">Invite your teammates to collaborate faster</h3>
              <p className="text-sm text-muted-foreground">
                Work together with your team to provide excellent customer support.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Circle className="mt-1 h-5 w-5 text-muted-foreground" />
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">Add content to power your AI and Help Center</h3>
              <p className="text-sm text-muted-foreground">
                Create knowledge base articles to help customers find answers quickly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

