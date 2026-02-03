import 'fastify'

import { organization as Organization } from '@/database/schemas/organization'
import { membership as Membership } from '@/database/schemas/membership'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getUserMembership(organizationId: string): Promise<{
      organization: Organization,
      membership: Membership
    }>
    signUser(payload: {
      sub: string
    }): Promise<void>
    signOut(): Promise<void>
  }
}