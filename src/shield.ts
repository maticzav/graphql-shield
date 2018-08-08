import { middleware, IMiddlewareGenerator } from 'graphql-middleware'
import { validateRules } from './utils'
import { IRules, IOptions } from './types'
import { generateMiddlewareGeneratorFromRuleTree } from './generator'

/**
 *
 * @param options
 *
 * Makes sure all of defined rules are in accord with the options
 * shield can process.
 *
 */
function normalizeOptions(options: IOptions): IOptions {
  return {
    debug: options.debug !== undefined ? options.debug : false,
    allowExternalErrors:
      options.allowExternalErrors !== undefined
        ? options.allowExternalErrors
        : false,
    whitelist: options.whitelist !== undefined ? options.whitelist : false,
    fallback:
      options.fallback !== undefined
        ? options.fallback
        : new Error('Not Authorised'),
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
  options: IOptions = {},
): IMiddlewareGenerator<TSource, TContext, TArgs> {
  const _options = normalizeOptions(options)

  validateRules(ruleTree)

  const generatorFunction = generateMiddlewareGeneratorFromRuleTree<
    TSource,
    TContext,
    TArgs
  >(ruleTree, _options)

  return middleware(generatorFunction)
}
