/**
 * Makes a type check that is only valid when all cases of a switch
 * statement have been convered.
 */
export class ExhaustiveSwitchCheck extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${JSON.stringify(val)}`)
  }
}

/**
 * Taken from
 * https://github.com/sindresorhus/type-fest/blob/main/source/primitive.d.ts.
 */
export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint

/**
 * PartialDeep implementation taken from
 * https://github.com/sindresorhus/type-fest/blob/main/source/partial-deep.d.ts.
 */
export type PartialDeep<T> = T extends Primitive
  ? Partial<T>
  : T extends Map<infer KeyType, infer ValueType>
  ? PartialMapDeep<KeyType, ValueType>
  : T extends Set<infer ItemType>
  ? PartialSetDeep<ItemType>
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
  ? PartialReadonlyMapDeep<KeyType, ValueType>
  : T extends ReadonlySet<infer ItemType>
  ? PartialReadonlySetDeep<ItemType>
  : T extends (...args: any[]) => unknown
  ? T | undefined
  : T extends object
  ? T extends Array<infer ItemType> // Test for arrays/tuples, per https://github.com/microsoft/TypeScript/issues/35156
    ? ItemType[] extends T // Test for arrays (non-tuples) specifically
      ? Array<PartialDeep<ItemType | undefined>> // Recreate relevant array type to prevent eager evaluation of circular reference
      : PartialObjectDeep<T> // Tuples behave properly
    : PartialObjectDeep<T>
  : unknown

/**
Same as `PartialDeep`, but accepts only `Map`s and as inputs. Internal helper for `PartialDeep`.
*/
interface PartialMapDeep<KeyType, ValueType>
  extends Map<PartialDeep<KeyType>, PartialDeep<ValueType>> {}

/**
Same as `PartialDeep`, but accepts only `Set`s as inputs. Internal helper for `PartialDeep`.
*/
interface PartialSetDeep<T> extends Set<PartialDeep<T>> {}

/**
Same as `PartialDeep`, but accepts only `ReadonlyMap`s as inputs. Internal helper for `PartialDeep`.
*/
interface PartialReadonlyMapDeep<KeyType, ValueType>
  extends ReadonlyMap<PartialDeep<KeyType>, PartialDeep<ValueType>> {}

/**
Same as `PartialDeep`, but accepts only `ReadonlySet`s as inputs. Internal helper for `PartialDeep`.
*/
interface PartialReadonlySetDeep<T> extends ReadonlySet<PartialDeep<T>> {}

/**
Same as `PartialDeep`, but accepts only `object`s as inputs. Internal helper for `PartialDeep`.
*/
type PartialObjectDeep<ObjectType extends object> = {
  [KeyType in keyof ObjectType]?: PartialDeep<ObjectType[KeyType]>
}
