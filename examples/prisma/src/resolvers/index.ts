import shield from '../../../../src/index'
import { Query } from './Query'
import { auth } from './Mutation/auth'
import { post } from './Mutation/post'
import { AuthPayload } from './AuthPayload'
import { isAuthenticated, isUserPost } from '../auth'

const resolvers = {
  Query,
  Mutation: {
    ...auth,
    ...post,
  },
  AuthPayload,
} 

const permissions = {
  Query: {
    feed: isAuthenticated,
    drafts: isAuthenticated,
    post: isAuthenticated,
    me: isAuthenticated
  },
  Mutation: {
    createDraft: isAuthenticated,
    publish: isUserPost,
    deletePost: isUserPost,
  },
}

export default shield(resolvers, permissions)