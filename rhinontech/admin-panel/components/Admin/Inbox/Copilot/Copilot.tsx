import React from 'react'
import { Rocket, Lightbulb, FileText, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

const Copilot = () => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
        <div className="max-w-md w-full space-y-12">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Copilot is here to help.</h1>
            <p className="text-2xl font-semibold text-gray-900">Just ask.</p>
          </div>

          {/* Features list */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-2 rounded-full">
                <Rocket className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-600">
                Copilot can find answers to customer queries by searching your team's support content and past
                conversations.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-2 rounded-full">
                <Lightbulb className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-600">
                It can help you figure out what to do, using your team's internal articles.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-2 rounded-full">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-600">
                All it needs is <span className="font-medium">knowledge</span>. The more content you give, the more
                expert Copilot becomes.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-2 rounded-full">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-gray-600">Copilot conversations are only visible to you.</p>
            </div>
          </div>

          {/* Copilot explained button */}
          <div className="flex justify-center">
            <Button variant="outline" className="rounded-full bg-white px-6 py-2 flex items-center gap-2">
              <span className="text-sm font-medium">Copilot explained</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask a question..."
              className="w-full py-3 px-4 pr-16 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3h18v18H3z" opacity="0" />
                  <path d="M8 12h8" />
                  <path d="M12 8v8" />
                </svg>
              </button>
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Copilot
