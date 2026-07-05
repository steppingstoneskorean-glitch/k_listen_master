const BANNER_HIDE_KEY = 'klisten_install_banner_hide_until'
const MODAL_HIDE_KEY = 'klisten_install_modal_hide_until'

function isHidden(key: string) {
  const raw = localStorage.getItem(key)
  if (!raw) return false
  const until = Number(raw)
  return Number.isFinite(until) && Date.now() < until
}

function hideFor(key: string, ms: number) {
  localStorage.setItem(key, String(Date.now() + ms))
}

export function isInstallBannerHidden() {
  return isHidden(BANNER_HIDE_KEY)
}

export function hideInstallBannerForDays(days = 7) {
  hideFor(BANNER_HIDE_KEY, days * 24 * 60 * 60 * 1000)
}

export function isInstallModalHidden() {
  return isHidden(MODAL_HIDE_KEY)
}

export function hideInstallModalForHours(hours = 24) {
  hideFor(MODAL_HIDE_KEY, hours * 60 * 60 * 1000)
}
