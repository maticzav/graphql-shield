import { ICustomError } from './types'

export class CustomError extends Error implements ICustomError {
  constructor(message) {
    super(message)
  }
}

export const error = (message: any): ICustomError => {
  return new CustomError(message)
}
