import * as jwt from 'jsonwebtoken'
import { Prisma } from './generated/prisma'

export interface Context {
  db: Prisma
  request: any
}

export function getUserEmail(ctx: Context): string {
  const Authorization = ctx.request.get('Authorization')
  if (Authorization) {
    const email = Authorization.replace('Bearer ', '')
    return email
  }
  return null
}
