import type { User } from '../types/auth'

export const mockUser: User = {
  id: 'u1',
  name: 'Maria Chen',
  email: 'maria.chen@example.com',
  role: 'Admin',
  locations: ['loc-a', 'loc-b'],
}

export const mockLoginResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
}
