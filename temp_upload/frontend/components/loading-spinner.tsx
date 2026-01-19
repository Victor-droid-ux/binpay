import { Logo } from "./logo"

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="animate-pulse">
        <Logo size="lg" />
      </div>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      </div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  )
}
