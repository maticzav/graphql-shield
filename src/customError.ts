export class CustomError extends Error {
  constructor(...args) {
    super(...args)
  }
}

export const error = (...args) => {
  return new CustomError(...args)
}
