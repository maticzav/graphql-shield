import { middleware, MiddlewareGenerator } from 'graphql-middleware'
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
): MiddlewareGenerator<TSource, TContext, TArgs> {
  const _options = normalizeOptions(options)

  validateRules(ruleTree)

  const generatorFunction = generateMiddlewareGeneratorFromRuleTree(
    ruleTree,
    _options,
  )

  return middleware(generatorFunction)
}
