import { ICustomError } from './types'

export class CustomError implements ICustomError {
  name: string
  message: string

  constructor(message) {
    // super(message)
  }
}

export const error = (message: any): ICustomError => {
  return new CustomError(message)
}
