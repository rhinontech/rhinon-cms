import { Button } from "@/components/ui/button"

export function TrialBanner() {
  return (
    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-sm border-[1px] border-blue-400">
      <div className="text-blue-700">
        You have <span className="font-medium">4 days</span> left in your Advanced trial
      </div>
      <div className="flex gap-2">
        <Button variant="default" size="sm" className="bg-gray-900 hover:bg-gray-800">
          Buy Rhinontech
        </Button>
        <Button variant="outline" size="sm" className="border-blue-200 bg-transparent text-blue-700 hover:bg-blue-100">
          Apply for an Early Stage 90% discount
        </Button>
      </div>
    </div>
  )
}

