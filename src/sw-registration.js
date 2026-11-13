import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onOfflineReady()
  {
    console.log('App ready to work Offline')
  },
})
