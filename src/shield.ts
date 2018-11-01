import { middleware, IMiddlewareGenerator } from 'graphql-middleware'
import { validateRules } from './utils'
import { IRules, IOptions, IOptionsConstructor } from './types'
import { generateMiddlewareGeneratorFromRuleTree } from './generator'
import { allow } from './constructors'

/**
 *
 * @param options
 *
 * Makes sure all of defined rules are in accord with the options
 * shield can process.
 *
 */
function normalizeOptions(options: IOptionsConstructor): IOptions {
  if (options.whitelist !== undefined && options.fallbackRule !== undefined) {
    throw new Error(
      'You specified both `whitelist` and `fallbackRule`. Please use one or the other.',
    )
  }

  if (options.fallback !== undefined && options.fallbackError !== undefined) {
    throw new Error(
      'You specified both `fallback` and `fallbackError`. Please use one or the other.',
    )
  }

  if (typeof options.fallback === 'string') {
    options.fallback = new Error(options.fallback)
  }

  if (typeof options.fallbackError === 'string') {
    options.fallbackError = new Error(options.fallbackError)
  }

  return {
    debug: options.debug !== undefined ? options.debug : false,
    allowExternalErrors:
      options.allowExternalErrors !== undefined
        ? options.allowExternalErrors
        : false,
    whitelist: options.whitelist !== undefined ? options.whitelist : false,
    fallbackRule:
      options.fallbackRule !== undefined ? options.fallbackRule : allow,
    graphiql: options.graphiql !== undefined ? options.graphiql : false,
    fallback: undefined,
    fallbackError:
      options.fallbackError !== undefined
        ? options.fallbackError
        : options.fallback !== undefined
          ? options.fallback
          : new Error('Not Authorised!'),
  }
}

/**
 *
 * @param ruleTree
 * @param options
 *
 * Validates rules and generates middleware from defined rule tree.
 *
 */
export function shield<TSource = any, TContext = any, TArgs = any>(
  ruleTree: IRules,
  options: IOptionsConstructor = {},
): IMiddlewareGenerator<TSource, TContext, TArgs> {
  const normalizedOptions = normalizeOptions(options)
  const validatedRuleTree = validateRules(ruleTree)

  const generatorFunction = generateMiddlewareGeneratorFromRuleTree<
    TSource,
    TContext,
    TArgs
  >(validatedRuleTree, normalizedOptions)

  return middleware(generatorFunction)
}
