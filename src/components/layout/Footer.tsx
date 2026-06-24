export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Step</span>
          <span className="text-sm font-black text-white">Korean</span>
        </div>
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Step Korean. All rights reserved.
        </p>
        <a
          href="https://payhip.com/StepKorean"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
        >
          Lessons & Guide →
        </a>
      </div>
    </footer>
  )
}
