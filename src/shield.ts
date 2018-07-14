import { IMiddlewareGenerator } from 'graphql-middleware'
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
    blacklist: options.blacklist !== undefined ? options.blacklist : false,
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
export function shield(
  ruleTree: IRules,
  options: IOptions = {},
): IMiddlewareGenerator {
  const _options = normalizeOptions(options)

  validateRules(ruleTree)

  return generateMiddlewareGeneratorFromRuleTree(ruleTree, _options)
}
