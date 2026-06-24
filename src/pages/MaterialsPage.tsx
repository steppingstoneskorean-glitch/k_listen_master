import { useLang } from '@/lib/i18n'

// Replace NOTION_URL with your actual Notion page URL
const NOTION_URL = 'https://notion.so'

export default function MaterialsPage() {
  const { t } = useLang()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-950 shrink-0">
        <div>
          <h1 className="font-black text-white">{t('materials.title')}</h1>
          <p className="text-gray-600 text-xs mt-0.5">{t('materials.desc')}</p>
        </div>
        <a
          href={NOTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors"
        >
          ↗ {t('materials.open')}
        </a>
      </div>

      {/* Embed — shows Notion page read-only */}
      <iframe
        src={NOTION_URL}
        title="Free Materials"
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
