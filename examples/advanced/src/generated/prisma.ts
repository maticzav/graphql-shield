import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { IResolvers } from 'graphql-tools/dist/Interfaces'
import { Options } from 'graphql-binding'
import { makePrismaBindingClass, BasePrismaOptions } from 'prisma-binding'

export interface Query {
  grocers: <T = Grocer[]>(
    args: {
      where?: GrocerWhereInput
      orderBy?: GrocerOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  customers: <T = Customer[]>(
    args: {
      where?: CustomerWhereInput
      orderBy?: CustomerOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  basketItems: <T = BasketItem[]>(
    args: {
      where?: BasketItemWhereInput
      orderBy?: BasketItemOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  products: <T = Product[]>(
    args: {
      where?: ProductWhereInput
      orderBy?: ProductOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  grocer: <T = Grocer | null>(
    args: { where: GrocerWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  customer: <T = Customer | null>(
    args: { where: CustomerWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  basketItem: <T = BasketItem | null>(
    args: { where: BasketItemWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  product: <T = Product | null>(
    args: { where: ProductWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  grocersConnection: <T = GrocerConnection>(
    args: {
      where?: GrocerWhereInput
      orderBy?: GrocerOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  customersConnection: <T = CustomerConnection>(
    args: {
      where?: CustomerWhereInput
      orderBy?: CustomerOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  basketItemsConnection: <T = BasketItemConnection>(
    args: {
      where?: BasketItemWhereInput
      orderBy?: BasketItemOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  productsConnection: <T = ProductConnection>(
    args: {
      where?: ProductWhereInput
      orderBy?: ProductOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  node: <T = Node | null>(
    args: { id: ID_Output },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
}

export interface Mutation {
  createGrocer: <T = Grocer>(
    args: { data: GrocerCreateInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  createCustomer: <T = Customer>(
    args: { data: CustomerCreateInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  createBasketItem: <T = BasketItem>(
    args: { data: BasketItemCreateInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  createProduct: <T = Product>(
    args: { data: ProductCreateInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateGrocer: <T = Grocer | null>(
    args: { data: GrocerUpdateInput; where: GrocerWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateCustomer: <T = Customer | null>(
    args: { data: CustomerUpdateInput; where: CustomerWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateBasketItem: <T = BasketItem | null>(
    args: { data: BasketItemUpdateInput; where: BasketItemWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateProduct: <T = Product | null>(
    args: { data: ProductUpdateInput; where: ProductWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteGrocer: <T = Grocer | null>(
    args: { where: GrocerWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteCustomer: <T = Customer | null>(
    args: { where: CustomerWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteBasketItem: <T = BasketItem | null>(
    args: { where: BasketItemWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteProduct: <T = Product | null>(
    args: { where: ProductWhereUniqueInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  upsertGrocer: <T = Grocer>(
    args: {
      where: GrocerWhereUniqueInput
      create: GrocerCreateInput
      update: GrocerUpdateInput
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  upsertCustomer: <T = Customer>(
    args: {
      where: CustomerWhereUniqueInput
      create: CustomerCreateInput
      update: CustomerUpdateInput
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  upsertBasketItem: <T = BasketItem>(
    args: {
      where: BasketItemWhereUniqueInput
      create: BasketItemCreateInput
      update: BasketItemUpdateInput
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  upsertProduct: <T = Product>(
    args: {
      where: ProductWhereUniqueInput
      create: ProductCreateInput
      update: ProductUpdateInput
    },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateManyGrocers: <T = BatchPayload>(
    args: { data: GrocerUpdateInput; where?: GrocerWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateManyCustomers: <T = BatchPayload>(
    args: { data: CustomerUpdateInput; where?: CustomerWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateManyBasketItems: <T = BatchPayload>(
    args: { data: BasketItemUpdateInput; where?: BasketItemWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  updateManyProducts: <T = BatchPayload>(
    args: { data: ProductUpdateInput; where?: ProductWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteManyGrocers: <T = BatchPayload>(
    args: { where?: GrocerWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteManyCustomers: <T = BatchPayload>(
    args: { where?: CustomerWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteManyBasketItems: <T = BatchPayload>(
    args: { where?: BasketItemWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
  deleteManyProducts: <T = BatchPayload>(
    args: { where?: ProductWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<T>
}

export interface Subscription {
  grocer: <T = GrocerSubscriptionPayload | null>(
    args: { where?: GrocerSubscriptionWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<AsyncIterator<T>>
  customer: <T = CustomerSubscriptionPayload | null>(
    args: { where?: CustomerSubscriptionWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<AsyncIterator<T>>
  basketItem: <T = BasketItemSubscriptionPayload | null>(
    args: { where?: BasketItemSubscriptionWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<AsyncIterator<T>>
  product: <T = ProductSubscriptionPayload | null>(
    args: { where?: ProductSubscriptionWhereInput },
    info?: GraphQLResolveInfo | string,
    options?: Options,
  ) => Promise<AsyncIterator<T>>
}

export interface Exists {
  Grocer: (where?: GrocerWhereInput) => Promise<boolean>
  Customer: (where?: CustomerWhereInput) => Promise<boolean>
  BasketItem: (where?: BasketItemWhereInput) => Promise<boolean>
  Product: (where?: ProductWhereInput) => Promise<boolean>
}

export interface Prisma {
  query: Query
  mutation: Mutation
  subscription: Subscription
  exists: Exists
  request: <T = any>(
    query: string,
    variables?: { [key: string]: any },
  ) => Promise<T>
  delegate(
    operation: 'query' | 'mutation',
    fieldName: string,
    args: {
      [key: string]: any
    },
    infoOrQuery?: GraphQLResolveInfo | string,
    options?: Options,
  ): Promise<any>
  delegateSubscription(
    fieldName: string,
    args?: {
      [key: string]: any
    },
    infoOrQuery?: GraphQLResolveInfo | string,
    options?: Options,
  ): Promise<AsyncIterator<any>>
  getAbstractResolvers(filterSchema?: GraphQLSchema | string): IResolvers
}

export interface BindingConstructor<T> {
  new (options: BasePrismaOptions): T
}
/**
 * Type Defs
 */

const typeDefs = `type AggregateBasketItem {
  count: Int!
}

type AggregateCustomer {
  count: Int!
}

type AggregateGrocer {
  count: Int!
}

type AggregateProduct {
  count: Int!
}

type BasketItem implements Node {
  id: ID!
  customer(where: CustomerWhereInput): Customer!
  product(where: ProductWhereInput): Product!
  quantity: Int!
}

"""A connection to a list of items."""
type BasketItemConnection {
  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """A list of edges."""
  edges: [BasketItemEdge]!
  aggregate: AggregateBasketItem!
}

input BasketItemCreateInput {
  quantity: Int!
  customer: CustomerCreateOneWithoutBasketInput!
  product: ProductCreateOneInput!
}

input BasketItemCreateManyWithoutCustomerInput {
  create: [BasketItemCreateWithoutCustomerInput!]
  connect: [BasketItemWhereUniqueInput!]
}

input BasketItemCreateWithoutCustomerInput {
  quantity: Int!
  product: ProductCreateOneInput!
}

"""An edge in a connection."""
type BasketItemEdge {
  """The item at the end of the edge."""
  node: BasketItem!

  """A cursor for use in pagination."""
  cursor: String!
}

enum BasketItemOrderByInput {
  id_ASC
  id_DESC
  quantity_ASC
  quantity_DESC
  updatedAt_ASC
  updatedAt_DESC
  createdAt_ASC
  createdAt_DESC
}

type BasketItemPreviousValues {
  id: ID!
  quantity: Int!
}

type BasketItemSubscriptionPayload {
  mutation: MutationType!
  node: BasketItem
  updatedFields: [String!]
  previousValues: BasketItemPreviousValues
}

input BasketItemSubscriptionWhereInput {
  """Logical AND on all given filters."""
  AND: [BasketItemSubscriptionWhereInput!]

  """Logical OR on all given filters."""
  OR: [BasketItemSubscriptionWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [BasketItemSubscriptionWhereInput!]

  """
  The subscription event gets dispatched when it's listed in mutation_in
  """
  mutation_in: [MutationType!]

  """
  The subscription event gets only dispatched when one of the updated fields names is included in this list
  """
  updatedFields_contains: String

  """
  The subscription event gets only dispatched when all of the field names included in this list have been updated
  """
  updatedFields_contains_every: [String!]

  """
  The subscription event gets only dispatched when some of the field names included in this list have been updated
  """
  updatedFields_contains_some: [String!]
  node: BasketItemWhereInput
}

input BasketItemUpdateInput {
  quantity: Int
  customer: CustomerUpdateOneWithoutBasketInput
  product: ProductUpdateOneInput
}

input BasketItemUpdateManyWithoutCustomerInput {
  create: [BasketItemCreateWithoutCustomerInput!]
  connect: [BasketItemWhereUniqueInput!]
  disconnect: [BasketItemWhereUniqueInput!]
  delete: [BasketItemWhereUniqueInput!]
  update: [BasketItemUpdateWithWhereUniqueWithoutCustomerInput!]
  upsert: [BasketItemUpsertWithWhereUniqueWithoutCustomerInput!]
}

input BasketItemUpdateWithoutCustomerDataInput {
  quantity: Int
  product: ProductUpdateOneInput
}

input BasketItemUpdateWithWhereUniqueWithoutCustomerInput {
  where: BasketItemWhereUniqueInput!
  data: BasketItemUpdateWithoutCustomerDataInput!
}

input BasketItemUpsertWithWhereUniqueWithoutCustomerInput {
  where: BasketItemWhereUniqueInput!
  update: BasketItemUpdateWithoutCustomerDataInput!
  create: BasketItemCreateWithoutCustomerInput!
}

input BasketItemWhereInput {
  """Logical AND on all given filters."""
  AND: [BasketItemWhereInput!]

  """Logical OR on all given filters."""
  OR: [BasketItemWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [BasketItemWhereInput!]
  id: ID

  """All values that are not equal to given value."""
  id_not: ID

  """All values that are contained in given list."""
  id_in: [ID!]

  """All values that are not contained in given list."""
  id_not_in: [ID!]

  """All values less than the given value."""
  id_lt: ID

  """All values less than or equal the given value."""
  id_lte: ID

  """All values greater than the given value."""
  id_gt: ID

  """All values greater than or equal the given value."""
  id_gte: ID

  """All values containing the given string."""
  id_contains: ID

  """All values not containing the given string."""
  id_not_contains: ID

  """All values starting with the given string."""
  id_starts_with: ID

  """All values not starting with the given string."""
  id_not_starts_with: ID

  """All values ending with the given string."""
  id_ends_with: ID

  """All values not ending with the given string."""
  id_not_ends_with: ID
  quantity: Int

  """All values that are not equal to given value."""
  quantity_not: Int

  """All values that are contained in given list."""
  quantity_in: [Int!]

  """All values that are not contained in given list."""
  quantity_not_in: [Int!]

  """All values less than the given value."""
  quantity_lt: Int

  """All values less than or equal the given value."""
  quantity_lte: Int

  """All values greater than the given value."""
  quantity_gt: Int

  """All values greater than or equal the given value."""
  quantity_gte: Int
  customer: CustomerWhereInput
  product: ProductWhereInput
}

input BasketItemWhereUniqueInput {
  id: ID
}

type BatchPayload {
  """The number of nodes that have been affected by the Batch operation."""
  count: Long!
}

type Customer implements Node {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  email: String!
  basket(where: BasketItemWhereInput, orderBy: BasketItemOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [BasketItem!]
}

"""A connection to a list of items."""
type CustomerConnection {
  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """A list of edges."""
  edges: [CustomerEdge]!
  aggregate: AggregateCustomer!
}

input CustomerCreateInput {
  email: String!
  basket: BasketItemCreateManyWithoutCustomerInput
}

input CustomerCreateOneWithoutBasketInput {
  create: CustomerCreateWithoutBasketInput
  connect: CustomerWhereUniqueInput
}

input CustomerCreateWithoutBasketInput {
  email: String!
}

"""An edge in a connection."""
type CustomerEdge {
  """The item at the end of the edge."""
  node: Customer!

  """A cursor for use in pagination."""
  cursor: String!
}

enum CustomerOrderByInput {
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  email_ASC
  email_DESC
}

type CustomerPreviousValues {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  email: String!
}

type CustomerSubscriptionPayload {
  mutation: MutationType!
  node: Customer
  updatedFields: [String!]
  previousValues: CustomerPreviousValues
}

input CustomerSubscriptionWhereInput {
  """Logical AND on all given filters."""
  AND: [CustomerSubscriptionWhereInput!]

  """Logical OR on all given filters."""
  OR: [CustomerSubscriptionWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [CustomerSubscriptionWhereInput!]

  """
  The subscription event gets dispatched when it's listed in mutation_in
  """
  mutation_in: [MutationType!]

  """
  The subscription event gets only dispatched when one of the updated fields names is included in this list
  """
  updatedFields_contains: String

  """
  The subscription event gets only dispatched when all of the field names included in this list have been updated
  """
  updatedFields_contains_every: [String!]

  """
  The subscription event gets only dispatched when some of the field names included in this list have been updated
  """
  updatedFields_contains_some: [String!]
  node: CustomerWhereInput
}

input CustomerUpdateInput {
  email: String
  basket: BasketItemUpdateManyWithoutCustomerInput
}

input CustomerUpdateOneWithoutBasketInput {
  create: CustomerCreateWithoutBasketInput
  connect: CustomerWhereUniqueInput
  delete: Boolean
  update: CustomerUpdateWithoutBasketDataInput
  upsert: CustomerUpsertWithoutBasketInput
}

input CustomerUpdateWithoutBasketDataInput {
  email: String
}

input CustomerUpsertWithoutBasketInput {
  update: CustomerUpdateWithoutBasketDataInput!
  create: CustomerCreateWithoutBasketInput!
}

input CustomerWhereInput {
  """Logical AND on all given filters."""
  AND: [CustomerWhereInput!]

  """Logical OR on all given filters."""
  OR: [CustomerWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [CustomerWhereInput!]
  id: ID

  """All values that are not equal to given value."""
  id_not: ID

  """All values that are contained in given list."""
  id_in: [ID!]

  """All values that are not contained in given list."""
  id_not_in: [ID!]

  """All values less than the given value."""
  id_lt: ID

  """All values less than or equal the given value."""
  id_lte: ID

  """All values greater than the given value."""
  id_gt: ID

  """All values greater than or equal the given value."""
  id_gte: ID

  """All values containing the given string."""
  id_contains: ID

  """All values not containing the given string."""
  id_not_contains: ID

  """All values starting with the given string."""
  id_starts_with: ID

  """All values not starting with the given string."""
  id_not_starts_with: ID

  """All values ending with the given string."""
  id_ends_with: ID

  """All values not ending with the given string."""
  id_not_ends_with: ID
  createdAt: DateTime

  """All values that are not equal to given value."""
  createdAt_not: DateTime

  """All values that are contained in given list."""
  createdAt_in: [DateTime!]

  """All values that are not contained in given list."""
  createdAt_not_in: [DateTime!]

  """All values less than the given value."""
  createdAt_lt: DateTime

  """All values less than or equal the given value."""
  createdAt_lte: DateTime

  """All values greater than the given value."""
  createdAt_gt: DateTime

  """All values greater than or equal the given value."""
  createdAt_gte: DateTime
  updatedAt: DateTime

  """All values that are not equal to given value."""
  updatedAt_not: DateTime

  """All values that are contained in given list."""
  updatedAt_in: [DateTime!]

  """All values that are not contained in given list."""
  updatedAt_not_in: [DateTime!]

  """All values less than the given value."""
  updatedAt_lt: DateTime

  """All values less than or equal the given value."""
  updatedAt_lte: DateTime

  """All values greater than the given value."""
  updatedAt_gt: DateTime

  """All values greater than or equal the given value."""
  updatedAt_gte: DateTime
  email: String

  """All values that are not equal to given value."""
  email_not: String

  """All values that are contained in given list."""
  email_in: [String!]

  """All values that are not contained in given list."""
  email_not_in: [String!]

  """All values less than the given value."""
  email_lt: String

  """All values less than or equal the given value."""
  email_lte: String

  """All values greater than the given value."""
  email_gt: String

  """All values greater than or equal the given value."""
  email_gte: String

  """All values containing the given string."""
  email_contains: String

  """All values not containing the given string."""
  email_not_contains: String

  """All values starting with the given string."""
  email_starts_with: String

  """All values not starting with the given string."""
  email_not_starts_with: String

  """All values ending with the given string."""
  email_ends_with: String

  """All values not ending with the given string."""
  email_not_ends_with: String
  basket_every: BasketItemWhereInput
  basket_some: BasketItemWhereInput
  basket_none: BasketItemWhereInput
}

input CustomerWhereUniqueInput {
  id: ID
  email: String
}

scalar DateTime

type Grocer implements Node {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  email: String!
}

"""A connection to a list of items."""
type GrocerConnection {
  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """A list of edges."""
  edges: [GrocerEdge]!
  aggregate: AggregateGrocer!
}

input GrocerCreateInput {
  email: String!
}

"""An edge in a connection."""
type GrocerEdge {
  """The item at the end of the edge."""
  node: Grocer!

  """A cursor for use in pagination."""
  cursor: String!
}

enum GrocerOrderByInput {
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  email_ASC
  email_DESC
}

type GrocerPreviousValues {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  email: String!
}

type GrocerSubscriptionPayload {
  mutation: MutationType!
  node: Grocer
  updatedFields: [String!]
  previousValues: GrocerPreviousValues
}

input GrocerSubscriptionWhereInput {
  """Logical AND on all given filters."""
  AND: [GrocerSubscriptionWhereInput!]

  """Logical OR on all given filters."""
  OR: [GrocerSubscriptionWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [GrocerSubscriptionWhereInput!]

  """
  The subscription event gets dispatched when it's listed in mutation_in
  """
  mutation_in: [MutationType!]

  """
  The subscription event gets only dispatched when one of the updated fields names is included in this list
  """
  updatedFields_contains: String

  """
  The subscription event gets only dispatched when all of the field names included in this list have been updated
  """
  updatedFields_contains_every: [String!]

  """
  The subscription event gets only dispatched when some of the field names included in this list have been updated
  """
  updatedFields_contains_some: [String!]
  node: GrocerWhereInput
}

input GrocerUpdateInput {
  email: String
}

input GrocerWhereInput {
  """Logical AND on all given filters."""
  AND: [GrocerWhereInput!]

  """Logical OR on all given filters."""
  OR: [GrocerWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [GrocerWhereInput!]
  id: ID

  """All values that are not equal to given value."""
  id_not: ID

  """All values that are contained in given list."""
  id_in: [ID!]

  """All values that are not contained in given list."""
  id_not_in: [ID!]

  """All values less than the given value."""
  id_lt: ID

  """All values less than or equal the given value."""
  id_lte: ID

  """All values greater than the given value."""
  id_gt: ID

  """All values greater than or equal the given value."""
  id_gte: ID

  """All values containing the given string."""
  id_contains: ID

  """All values not containing the given string."""
  id_not_contains: ID

  """All values starting with the given string."""
  id_starts_with: ID

  """All values not starting with the given string."""
  id_not_starts_with: ID

  """All values ending with the given string."""
  id_ends_with: ID

  """All values not ending with the given string."""
  id_not_ends_with: ID
  createdAt: DateTime

  """All values that are not equal to given value."""
  createdAt_not: DateTime

  """All values that are contained in given list."""
  createdAt_in: [DateTime!]

  """All values that are not contained in given list."""
  createdAt_not_in: [DateTime!]

  """All values less than the given value."""
  createdAt_lt: DateTime

  """All values less than or equal the given value."""
  createdAt_lte: DateTime

  """All values greater than the given value."""
  createdAt_gt: DateTime

  """All values greater than or equal the given value."""
  createdAt_gte: DateTime
  updatedAt: DateTime

  """All values that are not equal to given value."""
  updatedAt_not: DateTime

  """All values that are contained in given list."""
  updatedAt_in: [DateTime!]

  """All values that are not contained in given list."""
  updatedAt_not_in: [DateTime!]

  """All values less than the given value."""
  updatedAt_lt: DateTime

  """All values less than or equal the given value."""
  updatedAt_lte: DateTime

  """All values greater than the given value."""
  updatedAt_gt: DateTime

  """All values greater than or equal the given value."""
  updatedAt_gte: DateTime
  email: String

  """All values that are not equal to given value."""
  email_not: String

  """All values that are contained in given list."""
  email_in: [String!]

  """All values that are not contained in given list."""
  email_not_in: [String!]

  """All values less than the given value."""
  email_lt: String

  """All values less than or equal the given value."""
  email_lte: String

  """All values greater than the given value."""
  email_gt: String

  """All values greater than or equal the given value."""
  email_gte: String

  """All values containing the given string."""
  email_contains: String

  """All values not containing the given string."""
  email_not_contains: String

  """All values starting with the given string."""
  email_starts_with: String

  """All values not starting with the given string."""
  email_not_starts_with: String

  """All values ending with the given string."""
  email_ends_with: String

  """All values not ending with the given string."""
  email_not_ends_with: String
}

input GrocerWhereUniqueInput {
  id: ID
  email: String
}

"""
The \`Long\` scalar type represents non-fractional signed whole numeric values.
Long can represent values between -(2^63) and 2^63 - 1.
"""
scalar Long

type Mutation {
  createGrocer(data: GrocerCreateInput!): Grocer!
  createCustomer(data: CustomerCreateInput!): Customer!
  createBasketItem(data: BasketItemCreateInput!): BasketItem!
  createProduct(data: ProductCreateInput!): Product!
  updateGrocer(data: GrocerUpdateInput!, where: GrocerWhereUniqueInput!): Grocer
  updateCustomer(data: CustomerUpdateInput!, where: CustomerWhereUniqueInput!): Customer
  updateBasketItem(data: BasketItemUpdateInput!, where: BasketItemWhereUniqueInput!): BasketItem
  updateProduct(data: ProductUpdateInput!, where: ProductWhereUniqueInput!): Product
  deleteGrocer(where: GrocerWhereUniqueInput!): Grocer
  deleteCustomer(where: CustomerWhereUniqueInput!): Customer
  deleteBasketItem(where: BasketItemWhereUniqueInput!): BasketItem
  deleteProduct(where: ProductWhereUniqueInput!): Product
  upsertGrocer(where: GrocerWhereUniqueInput!, create: GrocerCreateInput!, update: GrocerUpdateInput!): Grocer!
  upsertCustomer(where: CustomerWhereUniqueInput!, create: CustomerCreateInput!, update: CustomerUpdateInput!): Customer!
  upsertBasketItem(where: BasketItemWhereUniqueInput!, create: BasketItemCreateInput!, update: BasketItemUpdateInput!): BasketItem!
  upsertProduct(where: ProductWhereUniqueInput!, create: ProductCreateInput!, update: ProductUpdateInput!): Product!
  updateManyGrocers(data: GrocerUpdateInput!, where: GrocerWhereInput): BatchPayload!
  updateManyCustomers(data: CustomerUpdateInput!, where: CustomerWhereInput): BatchPayload!
  updateManyBasketItems(data: BasketItemUpdateInput!, where: BasketItemWhereInput): BatchPayload!
  updateManyProducts(data: ProductUpdateInput!, where: ProductWhereInput): BatchPayload!
  deleteManyGrocers(where: GrocerWhereInput): BatchPayload!
  deleteManyCustomers(where: CustomerWhereInput): BatchPayload!
  deleteManyBasketItems(where: BasketItemWhereInput): BatchPayload!
  deleteManyProducts(where: ProductWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

"""An object with an ID"""
interface Node {
  """The id of the object."""
  id: ID!
}

"""Information about pagination in a connection."""
type PageInfo {
  """When paginating forwards, are there more items?"""
  hasNextPage: Boolean!

  """When paginating backwards, are there more items?"""
  hasPreviousPage: Boolean!

  """When paginating backwards, the cursor to continue."""
  startCursor: String

  """When paginating forwards, the cursor to continue."""
  endCursor: String
}

type Product implements Node {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: String!
  description: String!
  price: Int!
}

"""A connection to a list of items."""
type ProductConnection {
  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """A list of edges."""
  edges: [ProductEdge]!
  aggregate: AggregateProduct!
}

input ProductCreateInput {
  name: String!
  description: String!
  price: Int!
}

input ProductCreateOneInput {
  create: ProductCreateInput
  connect: ProductWhereUniqueInput
}

"""An edge in a connection."""
type ProductEdge {
  """The item at the end of the edge."""
  node: Product!

  """A cursor for use in pagination."""
  cursor: String!
}

enum ProductOrderByInput {
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
  name_ASC
  name_DESC
  description_ASC
  description_DESC
  price_ASC
  price_DESC
}

type ProductPreviousValues {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  name: String!
  description: String!
  price: Int!
}

type ProductSubscriptionPayload {
  mutation: MutationType!
  node: Product
  updatedFields: [String!]
  previousValues: ProductPreviousValues
}

input ProductSubscriptionWhereInput {
  """Logical AND on all given filters."""
  AND: [ProductSubscriptionWhereInput!]

  """Logical OR on all given filters."""
  OR: [ProductSubscriptionWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [ProductSubscriptionWhereInput!]

  """
  The subscription event gets dispatched when it's listed in mutation_in
  """
  mutation_in: [MutationType!]

  """
  The subscription event gets only dispatched when one of the updated fields names is included in this list
  """
  updatedFields_contains: String

  """
  The subscription event gets only dispatched when all of the field names included in this list have been updated
  """
  updatedFields_contains_every: [String!]

  """
  The subscription event gets only dispatched when some of the field names included in this list have been updated
  """
  updatedFields_contains_some: [String!]
  node: ProductWhereInput
}

input ProductUpdateDataInput {
  name: String
  description: String
  price: Int
}

input ProductUpdateInput {
  name: String
  description: String
  price: Int
}

input ProductUpdateOneInput {
  create: ProductCreateInput
  connect: ProductWhereUniqueInput
  delete: Boolean
  update: ProductUpdateDataInput
  upsert: ProductUpsertNestedInput
}

input ProductUpsertNestedInput {
  update: ProductUpdateDataInput!
  create: ProductCreateInput!
}

input ProductWhereInput {
  """Logical AND on all given filters."""
  AND: [ProductWhereInput!]

  """Logical OR on all given filters."""
  OR: [ProductWhereInput!]

  """Logical NOT on all given filters combined by AND."""
  NOT: [ProductWhereInput!]
  id: ID

  """All values that are not equal to given value."""
  id_not: ID

  """All values that are contained in given list."""
  id_in: [ID!]

  """All values that are not contained in given list."""
  id_not_in: [ID!]

  """All values less than the given value."""
  id_lt: ID

  """All values less than or equal the given value."""
  id_lte: ID

  """All values greater than the given value."""
  id_gt: ID

  """All values greater than or equal the given value."""
  id_gte: ID

  """All values containing the given string."""
  id_contains: ID

  """All values not containing the given string."""
  id_not_contains: ID

  """All values starting with the given string."""
  id_starts_with: ID

  """All values not starting with the given string."""
  id_not_starts_with: ID

  """All values ending with the given string."""
  id_ends_with: ID

  """All values not ending with the given string."""
  id_not_ends_with: ID
  createdAt: DateTime

  """All values that are not equal to given value."""
  createdAt_not: DateTime

  """All values that are contained in given list."""
  createdAt_in: [DateTime!]

  """All values that are not contained in given list."""
  createdAt_not_in: [DateTime!]

  """All values less than the given value."""
  createdAt_lt: DateTime

  """All values less than or equal the given value."""
  createdAt_lte: DateTime

  """All values greater than the given value."""
  createdAt_gt: DateTime

  """All values greater than or equal the given value."""
  createdAt_gte: DateTime
  updatedAt: DateTime

  """All values that are not equal to given value."""
  updatedAt_not: DateTime

  """All values that are contained in given list."""
  updatedAt_in: [DateTime!]

  """All values that are not contained in given list."""
  updatedAt_not_in: [DateTime!]

  """All values less than the given value."""
  updatedAt_lt: DateTime

  """All values less than or equal the given value."""
  updatedAt_lte: DateTime

  """All values greater than the given value."""
  updatedAt_gt: DateTime

  """All values greater than or equal the given value."""
  updatedAt_gte: DateTime
  name: String

  """All values that are not equal to given value."""
  name_not: String

  """All values that are contained in given list."""
  name_in: [String!]

  """All values that are not contained in given list."""
  name_not_in: [String!]

  """All values less than the given value."""
  name_lt: String

  """All values less than or equal the given value."""
  name_lte: String

  """All values greater than the given value."""
  name_gt: String

  """All values greater than or equal the given value."""
  name_gte: String

  """All values containing the given string."""
  name_contains: String

  """All values not containing the given string."""
  name_not_contains: String

  """All values starting with the given string."""
  name_starts_with: String

  """All values not starting with the given string."""
  name_not_starts_with: String

  """All values ending with the given string."""
  name_ends_with: String

  """All values not ending with the given string."""
  name_not_ends_with: String
  description: String

  """All values that are not equal to given value."""
  description_not: String

  """All values that are contained in given list."""
  description_in: [String!]

  """All values that are not contained in given list."""
  description_not_in: [String!]

  """All values less than the given value."""
  description_lt: String

  """All values less than or equal the given value."""
  description_lte: String

  """All values greater than the given value."""
  description_gt: String

  """All values greater than or equal the given value."""
  description_gte: String

  """All values containing the given string."""
  description_contains: String

  """All values not containing the given string."""
  description_not_contains: String

  """All values starting with the given string."""
  description_starts_with: String

  """All values not starting with the given string."""
  description_not_starts_with: String

  """All values ending with the given string."""
  description_ends_with: String

  """All values not ending with the given string."""
  description_not_ends_with: String
  price: Int

  """All values that are not equal to given value."""
  price_not: Int

  """All values that are contained in given list."""
  price_in: [Int!]

  """All values that are not contained in given list."""
  price_not_in: [Int!]

  """All values less than the given value."""
  price_lt: Int

  """All values less than or equal the given value."""
  price_lte: Int

  """All values greater than the given value."""
  price_gt: Int

  """All values greater than or equal the given value."""
  price_gte: Int
}

input ProductWhereUniqueInput {
  id: ID
}

type Query {
  grocers(where: GrocerWhereInput, orderBy: GrocerOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Grocer]!
  customers(where: CustomerWhereInput, orderBy: CustomerOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Customer]!
  basketItems(where: BasketItemWhereInput, orderBy: BasketItemOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [BasketItem]!
  products(where: ProductWhereInput, orderBy: ProductOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Product]!
  grocer(where: GrocerWhereUniqueInput!): Grocer
  customer(where: CustomerWhereUniqueInput!): Customer
  basketItem(where: BasketItemWhereUniqueInput!): BasketItem
  product(where: ProductWhereUniqueInput!): Product
  grocersConnection(where: GrocerWhereInput, orderBy: GrocerOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): GrocerConnection!
  customersConnection(where: CustomerWhereInput, orderBy: CustomerOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): CustomerConnection!
  basketItemsConnection(where: BasketItemWhereInput, orderBy: BasketItemOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): BasketItemConnection!
  productsConnection(where: ProductWhereInput, orderBy: ProductOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): ProductConnection!

  """Fetches an object given its ID"""
  node(
    """The ID of an object"""
    id: ID!
  ): Node
}

type Subscription {
  grocer(where: GrocerSubscriptionWhereInput): GrocerSubscriptionPayload
  customer(where: CustomerSubscriptionWhereInput): CustomerSubscriptionPayload
  basketItem(where: BasketItemSubscriptionWhereInput): BasketItemSubscriptionPayload
  product(where: ProductSubscriptionWhereInput): ProductSubscriptionPayload
}
`

export const Prisma = makePrismaBindingClass<BindingConstructor<Prisma>>({
  typeDefs,
})

/**
 * Types
 */

export type CustomerOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'
  | 'email_ASC'
  | 'email_DESC'

export type BasketItemOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'quantity_ASC'
  | 'quantity_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'

export type GrocerOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'
  | 'email_ASC'
  | 'email_DESC'

export type ProductOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'
  | 'name_ASC'
  | 'name_DESC'
  | 'description_ASC'
  | 'description_DESC'
  | 'price_ASC'
  | 'price_DESC'

export type MutationType = 'CREATED' | 'UPDATED' | 'DELETED'

export interface CustomerCreateInput {
  email: String
  basket?: BasketItemCreateManyWithoutCustomerInput
}

export interface GrocerWhereInput {
  AND?: GrocerWhereInput[] | GrocerWhereInput
  OR?: GrocerWhereInput[] | GrocerWhereInput
  NOT?: GrocerWhereInput[] | GrocerWhereInput
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  createdAt?: DateTime
  createdAt_not?: DateTime
  createdAt_in?: DateTime[] | DateTime
  createdAt_not_in?: DateTime[] | DateTime
  createdAt_lt?: DateTime
  createdAt_lte?: DateTime
  createdAt_gt?: DateTime
  createdAt_gte?: DateTime
  updatedAt?: DateTime
  updatedAt_not?: DateTime
  updatedAt_in?: DateTime[] | DateTime
  updatedAt_not_in?: DateTime[] | DateTime
  updatedAt_lt?: DateTime
  updatedAt_lte?: DateTime
  updatedAt_gt?: DateTime
  updatedAt_gte?: DateTime
  email?: String
  email_not?: String
  email_in?: String[] | String
  email_not_in?: String[] | String
  email_lt?: String
  email_lte?: String
  email_gt?: String
  email_gte?: String
  email_contains?: String
  email_not_contains?: String
  email_starts_with?: String
  email_not_starts_with?: String
  email_ends_with?: String
  email_not_ends_with?: String
}

export interface BasketItemUpsertWithWhereUniqueWithoutCustomerInput {
  where: BasketItemWhereUniqueInput
  update: BasketItemUpdateWithoutCustomerDataInput
  create: BasketItemCreateWithoutCustomerInput
}

export interface CustomerWhereInput {
  AND?: CustomerWhereInput[] | CustomerWhereInput
  OR?: CustomerWhereInput[] | CustomerWhereInput
  NOT?: CustomerWhereInput[] | CustomerWhereInput
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  createdAt?: DateTime
  createdAt_not?: DateTime
  createdAt_in?: DateTime[] | DateTime
  createdAt_not_in?: DateTime[] | DateTime
  createdAt_lt?: DateTime
  createdAt_lte?: DateTime
  createdAt_gt?: DateTime
  createdAt_gte?: DateTime
  updatedAt?: DateTime
  updatedAt_not?: DateTime
  updatedAt_in?: DateTime[] | DateTime
  updatedAt_not_in?: DateTime[] | DateTime
  updatedAt_lt?: DateTime
  updatedAt_lte?: DateTime
  updatedAt_gt?: DateTime
  updatedAt_gte?: DateTime
  email?: String
  email_not?: String
  email_in?: String[] | String
  email_not_in?: String[] | String
  email_lt?: String
  email_lte?: String
  email_gt?: String
  email_gte?: String
  email_contains?: String
  email_not_contains?: String
  email_starts_with?: String
  email_not_starts_with?: String
  email_ends_with?: String
  email_not_ends_with?: String
  basket_every?: BasketItemWhereInput
  basket_some?: BasketItemWhereInput
  basket_none?: BasketItemWhereInput
}

export interface ProductUpsertNestedInput {
  update: ProductUpdateDataInput
  create: ProductCreateInput
}

export interface ProductCreateInput {
  name: String
  description: String
  price: Int
}

export interface ProductUpdateDataInput {
  name?: String
  description?: String
  price?: Int
}

export interface ProductWhereInput {
  AND?: ProductWhereInput[] | ProductWhereInput
  OR?: ProductWhereInput[] | ProductWhereInput
  NOT?: ProductWhereInput[] | ProductWhereInput
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  createdAt?: DateTime
  createdAt_not?: DateTime
  createdAt_in?: DateTime[] | DateTime
  createdAt_not_in?: DateTime[] | DateTime
  createdAt_lt?: DateTime
  createdAt_lte?: DateTime
  createdAt_gt?: DateTime
  createdAt_gte?: DateTime
  updatedAt?: DateTime
  updatedAt_not?: DateTime
  updatedAt_in?: DateTime[] | DateTime
  updatedAt_not_in?: DateTime[] | DateTime
  updatedAt_lt?: DateTime
  updatedAt_lte?: DateTime
  updatedAt_gt?: DateTime
  updatedAt_gte?: DateTime
  name?: String
  name_not?: String
  name_in?: String[] | String
  name_not_in?: String[] | String
  name_lt?: String
  name_lte?: String
  name_gt?: String
  name_gte?: String
  name_contains?: String
  name_not_contains?: String
  name_starts_with?: String
  name_not_starts_with?: String
  name_ends_with?: String
  name_not_ends_with?: String
  description?: String
  description_not?: String
  description_in?: String[] | String
  description_not_in?: String[] | String
  description_lt?: String
  description_lte?: String
  description_gt?: String
  description_gte?: String
  description_contains?: String
  description_not_contains?: String
  description_starts_with?: String
  description_not_starts_with?: String
  description_ends_with?: String
  description_not_ends_with?: String
  price?: Int
  price_not?: Int
  price_in?: Int[] | Int
  price_not_in?: Int[] | Int
  price_lt?: Int
  price_lte?: Int
  price_gt?: Int
  price_gte?: Int
}

export interface ProductUpdateOneInput {
  create?: ProductCreateInput
  connect?: ProductWhereUniqueInput
  delete?: Boolean
  update?: ProductUpdateDataInput
  upsert?: ProductUpsertNestedInput
}

export interface BasketItemSubscriptionWhereInput {
  AND?: BasketItemSubscriptionWhereInput[] | BasketItemSubscriptionWhereInput
  OR?: BasketItemSubscriptionWhereInput[] | BasketItemSubscriptionWhereInput
  NOT?: BasketItemSubscriptionWhereInput[] | BasketItemSubscriptionWhereInput
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: BasketItemWhereInput
}

export interface BasketItemUpdateWithoutCustomerDataInput {
  quantity?: Int
  product?: ProductUpdateOneInput
}

export interface GrocerSubscriptionWhereInput {
  AND?: GrocerSubscriptionWhereInput[] | GrocerSubscriptionWhereInput
  OR?: GrocerSubscriptionWhereInput[] | GrocerSubscriptionWhereInput
  NOT?: GrocerSubscriptionWhereInput[] | GrocerSubscriptionWhereInput
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: GrocerWhereInput
}

export interface BasketItemUpdateWithWhereUniqueWithoutCustomerInput {
  where: BasketItemWhereUniqueInput
  data: BasketItemUpdateWithoutCustomerDataInput
}

export interface CustomerUpsertWithoutBasketInput {
  update: CustomerUpdateWithoutBasketDataInput
  create: CustomerCreateWithoutBasketInput
}

export interface BasketItemUpdateManyWithoutCustomerInput {
  create?:
    | BasketItemCreateWithoutCustomerInput[]
    | BasketItemCreateWithoutCustomerInput
  connect?: BasketItemWhereUniqueInput[] | BasketItemWhereUniqueInput
  disconnect?: BasketItemWhereUniqueInput[] | BasketItemWhereUniqueInput
  delete?: BasketItemWhereUniqueInput[] | BasketItemWhereUniqueInput
  update?:
    | BasketItemUpdateWithWhereUniqueWithoutCustomerInput[]
    | BasketItemUpdateWithWhereUniqueWithoutCustomerInput
  upsert?:
    | BasketItemUpsertWithWhereUniqueWithoutCustomerInput[]
    | BasketItemUpsertWithWhereUniqueWithoutCustomerInput
}

export interface CustomerWhereUniqueInput {
  id?: ID_Input
  email?: String
}

export interface CustomerUpdateInput {
  email?: String
  basket?: BasketItemUpdateManyWithoutCustomerInput
}

export interface ProductWhereUniqueInput {
  id?: ID_Input
}

export interface GrocerUpdateInput {
  email?: String
}

export interface CustomerUpdateOneWithoutBasketInput {
  create?: CustomerCreateWithoutBasketInput
  connect?: CustomerWhereUniqueInput
  delete?: Boolean
  update?: CustomerUpdateWithoutBasketDataInput
  upsert?: CustomerUpsertWithoutBasketInput
}

export interface CustomerCreateWithoutBasketInput {
  email: String
}

export interface BasketItemWhereInput {
  AND?: BasketItemWhereInput[] | BasketItemWhereInput
  OR?: BasketItemWhereInput[] | BasketItemWhereInput
  NOT?: BasketItemWhereInput[] | BasketItemWhereInput
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  quantity?: Int
  quantity_not?: Int
  quantity_in?: Int[] | Int
  quantity_not_in?: Int[] | Int
  quantity_lt?: Int
  quantity_lte?: Int
  quantity_gt?: Int
  quantity_gte?: Int
  customer?: CustomerWhereInput
  product?: ProductWhereInput
}

export interface CustomerCreateOneWithoutBasketInput {
  create?: CustomerCreateWithoutBasketInput
  connect?: CustomerWhereUniqueInput
}

export interface CustomerSubscriptionWhereInput {
  AND?: CustomerSubscriptionWhereInput[] | CustomerSubscriptionWhereInput
  OR?: CustomerSubscriptionWhereInput[] | CustomerSubscriptionWhereInput
  NOT?: CustomerSubscriptionWhereInput[] | CustomerSubscriptionWhereInput
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: CustomerWhereInput
}

export interface GrocerCreateInput {
  email: String
}

export interface GrocerWhereUniqueInput {
  id?: ID_Input
  email?: String
}

export interface CustomerUpdateWithoutBasketDataInput {
  email?: String
}

export interface ProductCreateOneInput {
  create?: ProductCreateInput
  connect?: ProductWhereUniqueInput
}

export interface BasketItemCreateWithoutCustomerInput {
  quantity: Int
  product: ProductCreateOneInput
}

export interface BasketItemCreateManyWithoutCustomerInput {
  create?:
    | BasketItemCreateWithoutCustomerInput[]
    | BasketItemCreateWithoutCustomerInput
  connect?: BasketItemWhereUniqueInput[] | BasketItemWhereUniqueInput
}

export interface BasketItemCreateInput {
  quantity: Int
  customer: CustomerCreateOneWithoutBasketInput
  product: ProductCreateOneInput
}

export interface BasketItemUpdateInput {
  quantity?: Int
  customer?: CustomerUpdateOneWithoutBasketInput
  product?: ProductUpdateOneInput
}

export interface BasketItemWhereUniqueInput {
  id?: ID_Input
}

export interface ProductUpdateInput {
  name?: String
  description?: String
  price?: Int
}

export interface ProductSubscriptionWhereInput {
  AND?: ProductSubscriptionWhereInput[] | ProductSubscriptionWhereInput
  OR?: ProductSubscriptionWhereInput[] | ProductSubscriptionWhereInput
  NOT?: ProductSubscriptionWhereInput[] | ProductSubscriptionWhereInput
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: ProductWhereInput
}

/*
 * An object with an ID

 */
export interface Node {
  id: ID_Output
}

export interface Product extends Node {
  id: ID_Output
  createdAt: DateTime
  updatedAt: DateTime
  name: String
  description: String
  price: Int
}

export interface ProductPreviousValues {
  id: ID_Output
  createdAt: DateTime
  updatedAt: DateTime
  name: String
  description: String
  price: Int
}

export interface BatchPayload {
  count: Long
}

/*
 * An edge in a connection.

 */
export interface ProductEdge {
  node: Product
  cursor: String
}

export interface AggregateProduct {
  count: Int
}

export interface Customer extends Node {
  id: ID_Output
  createdAt: DateTime
  updatedAt: DateTime
  email: String
  basket?: BasketItem[]
}

/*
 * A connection to a list of items.

 */
export interface ProductConnection {
  pageInfo: PageInfo
  edges: ProductEdge[]
  aggregate: AggregateProduct
}

export interface AggregateBasketItem {
  count: Int
}

/*
 * An edge in a connection.

 */
export interface BasketItemEdge {
  node: BasketItem
  cursor: String
}

export interface AggregateCustomer {
  count: Int
}

export interface BasketItem extends Node {
  id: ID_Output
  customer: Customer
  product: Product
  quantity: Int
}

/*
 * A connection to a list of items.

 */
export interface CustomerConnection {
  pageInfo: PageInfo
  edges: CustomerEdge[]
  aggregate: AggregateCustomer
}

export interface BasketItemPreviousValues {
  id: ID_Output
  quantity: Int
}

/*
 * An edge in a connection.

 */
export interface GrocerEdge {
  node: Grocer
  cursor: String
}

export interface GrocerSubscriptionPayload {
  mutation: MutationType
  node?: Grocer
  updatedFields?: String[]
  previousValues?: GrocerPreviousValues
}

/*
 * Information about pagination in a connection.

 */
export interface PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor?: String
  endCursor?: String
}

export interface Grocer extends Node {
  id: ID_Output
  createdAt: DateTime
  updatedAt: DateTime
  email: String
}

export interface CustomerPreviousValues {
  id: ID_Output
  createdAt: DateTime
  updatedAt: DateTime
  email: String
}

export interface CustomerSubscriptionPayload {
  mutation: MutationType
  node?: Customer
  updatedFields?: String[]
  previousValues?: CustomerPreviousValues
}

export interface BasketItemSubscriptionPayload {
  mutation: MutationType
  node?: BasketItem
  updatedFields?: String[]
  previousValues?: BasketItemPreviousValues
}

export interface GrocerPreviousValues {
  id: ID_Output
  createdAt: DateTime
  updatedAt: DateTime
  email: String
}

/*
 * A connection to a list of items.

 */
export interface BasketItemConnection {
  pageInfo: PageInfo
  edges: BasketItemEdge[]
  aggregate: AggregateBasketItem
}

/*
 * A connection to a list of items.

 */
export interface GrocerConnection {
  pageInfo: PageInfo
  edges: GrocerEdge[]
  aggregate: AggregateGrocer
}

export interface ProductSubscriptionPayload {
  mutation: MutationType
  node?: Product
  updatedFields?: String[]
  previousValues?: ProductPreviousValues
}

export interface AggregateGrocer {
  count: Int
}

/*
 * An edge in a connection.

 */
export interface CustomerEdge {
  node: Customer
  cursor: String
}

/*
The `Long` scalar type represents non-fractional signed whole numeric values.
Long can represent values between -(2^63) and 2^63 - 1.
*/
export type Long = string

/*
The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.
*/
export type ID_Input = string | number
export type ID_Output = string

/*
The `Boolean` scalar type represents `true` or `false`.
*/
export type Boolean = boolean

/*
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string

export type DateTime = Date | string

/*
The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. 
*/
export type Int = number
