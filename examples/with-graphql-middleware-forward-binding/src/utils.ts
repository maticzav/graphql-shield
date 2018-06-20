import { Prisma } from './generated/prisma'
import { Request } from 'express'

export interface Context {
  db: Prisma
  request: Request
}
