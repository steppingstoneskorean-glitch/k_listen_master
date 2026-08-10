/* public/firebase-messaging-sw.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FCM 백그라운드 메시지 전용 서비스워커.
 *   · 앱이 닫혀 있을 때 도착한 데이터 메시지를 받아 알림을 직접 띄운다.
 *   · Firebase 설정값은 등록 시 쿼리 파라미터로 전달받는다(모두 공개 키).
 *   · 서버(api/send-reminders.js)는 데이터 전용 메시지를 보내므로 알림 표시를
 *     이 SW 가 전담한다(중복 표시 방지).
 *   · vite-plugin-pwa 의 Workbox SW 와는 별개 파일이라 공존한다.
 * ───────────────────────────────────────────────────────────────────────────── */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

const params = new URL(self.location).searchParams
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(payload => {
  const data = payload.data || {}
  const title = data.title || 'Step Korean'
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'daily-reminder',
    renotify: true,
    data: { url: data.url || '/' },
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    }),
  )
})
