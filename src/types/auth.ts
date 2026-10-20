export type Role = 'Admin' | 'Manager' | 'Staff' | 'Auditor'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  locations: string[]
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: User
}
