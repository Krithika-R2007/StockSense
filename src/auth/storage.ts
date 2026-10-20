const ACCESS = 'accessToken'
const REFRESH = 'refreshToken'

export function storeTokens(
  accessToken: string,
  refreshToken: string,
  remember: boolean,
) {
  const store = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  store.setItem(ACCESS, accessToken)
  store.setItem(REFRESH, refreshToken)
  other.removeItem(ACCESS)
  other.removeItem(REFRESH)
}

export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH) ?? sessionStorage.getItem(REFRESH) ?? ''
  )
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
  sessionStorage.removeItem(ACCESS)
  sessionStorage.removeItem(REFRESH)
}

export function hasSession() {
  return !!(localStorage.getItem(ACCESS) ?? sessionStorage.getItem(ACCESS))
}
