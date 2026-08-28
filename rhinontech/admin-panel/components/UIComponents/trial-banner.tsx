import { Button } from "@/components/ui/button"

export function TrialBanner() {
  return (
    <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-400/10 px-4 py-3 text-sm border-[1px] border-blue-400">
      <div className="text-blue-700 dark:text-blue-300">
        You have <span className="font-medium">4 days</span> left in your Advanced trial
      </div>
      <div className="flex gap-2">
        <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
          Buy Rhinontech
        </Button>
        <Button variant="outline" size="sm" className="border-blue-200 dark:border-blue-400/25 bg-transparent text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-400/15">
          Apply for an Early Stage 90% discount
        </Button>
      </div>
    </div>
  )
}

