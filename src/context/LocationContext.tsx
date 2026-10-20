import { createContext, useContext, type ReactNode } from 'react'

const LocationContext = createContext({ locationId: 'all' })

export function LocationProvider({
  locationId,
  children,
}: {
  locationId: string
  children: ReactNode
}) {
  return (
    <LocationContext.Provider value={{ locationId }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationFilter() {
  return useContext(LocationContext)
}
