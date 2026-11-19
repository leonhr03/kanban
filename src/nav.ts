/** Projekt-Schlüssel aus der URL (#/WEB) – die URL ist die einzige Quelle für das aktive Board */
export const readHashKey = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')).toUpperCase()

export const subscribeHash = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export const goToProject = (key: string) => {
  location.hash = `/${key}`
}
