import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { openCookieSettings } from '@/lib/cookieConsent'
import AccountDeleteModal from '@/components/AccountDeleteModal'

export default function Footer() {
  const { t } = useLang()
  const { user } = useAuth()
  const [showDelete, setShowDelete] = useState(false)
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Step</span>
          <span className="text-sm font-black text-white">Korean</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/grammar" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            Grammar
          </Link>
          <Link to="/about" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            About
          </Link>
          <Link to="/terms" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            이용약관
          </Link>
          <Link to="/privacy" className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            개인정보처리방침
          </Link>
          <button
            onClick={openCookieSettings}
            className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors"
          >
            {t('cookie.settings')}
          </button>
          {user && (
            <button
              onClick={() => setShowDelete(true)}
              className="text-[11px] text-gray-700 hover:text-rose-400 transition-colors"
            >
              {t('account.delete')}
            </button>
          )}
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Step Korean. All rights reserved.
          </p>
        </div>
      </div>
      {showDelete && <AccountDeleteModal onClose={() => setShowDelete(false)} />}
    </footer>
  )
}
