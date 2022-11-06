export type Maybe<T> = T | undefined;

/** A safe variant of {Record} that prevents unexpected {undefined} access. */
export type Dict<K extends keyof any, T> = {
  [P in K]?: Maybe<T>;
};
