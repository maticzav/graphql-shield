import { shield, and } from 'graphql-shield'
import * as rules from './rules'

export const permissions = shield({
  Query: {
    viewer: rules.isCustomer,
    products: rules.isAuthenticated,
  },
  Mutation: {
    addItemToBasket: rules.isCustomer,
    removeItemFromBasket: rules.isCustomer,
    addProduct: rules.isGrocer,
    removeProduct: rules.isGrocer,
  },
})
