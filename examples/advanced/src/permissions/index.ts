import { shield, and } from 'graphql-shield'
import * as rules from './rules'

export const permissions = shield({
  Query: {
    viewer: rules.isCustomer,
  },
  Mutation: {
    addItemToBasket: rules.isCustomer,
    removeItemFromBasket: rules.isCustomer,
    addProduct: rules.isGrocer,
    removeProduct: rules.isGrocer,
  },
  Product: {
    price: rules.isAuthenticated,
  },
})
