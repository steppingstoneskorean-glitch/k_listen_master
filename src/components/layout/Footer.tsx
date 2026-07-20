import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Step</span>
          <span className="text-sm font-black text-white">Korean</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/about" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            About
          </Link>
          <Link to="/terms" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            이용약관
          </Link>
          <Link to="/privacy" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            개인정보처리방침
          </Link>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Step Korean. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
