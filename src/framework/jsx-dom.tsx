import React, { Fragment } from "react";
import { Dict, Maybe } from "./types";

/** A non-iterable React node. */
export type DomNode =
  | React.ReactElement
  | string
  | number
  | React.ReactPortal
  | boolean
  | null
  | undefined
  | DomNode[];

export type DomElement<P = {}> = React.ReactElement<P>;

/**
 * Check whether a DOM node is an element. Returns the element verbatim if
 * it is, or {undefined} otherwise (is not).
 */
export function ofAnyComponent(elem: DomNode): Maybe<DomElement> {
  if ((elem as Maybe<DomElement>)?.type) return elem as DomElement;
  return undefined;
}

/**
 * Check whether a DOM node is generated from a given component. If the element
 * is an instance of the component, the element itself is returned. Otherwise
 * will yield {undefined}.
 */
export function ofComponent<P = {}>(
  elem: DomNode,
  component: React.ComponentType<P>
): Maybe<DomElement<P>> {
  if ((elem as Maybe<DomElement>)?.type === component)
    return elem as DomElement<P>;
  return undefined;
}

/** Extract children element matching a given component. */
export function typedChildrenOf<P = {}>(
  elem: DomNode,
  component: React.ComponentType<P>
): DomElement<P>[] {
  const children: DomElement<P>[] = [];
  for (const child of childrenOf(elem))
    if ((child as DomElement)?.type === component)
      children.push(child as DomElement<P>);
  return children;
}

/** Extract *element* children, where Fragments are automatically flattened. */
export function childrenOf(elem: DomNode): DomElement[] {
  const directChildren = directChildrenOf(elem);
  const children: DomElement[] = [];
  for (const child of directChildren)
    if (Array.isArray(child) || child.type === Fragment) {
      for (const elem of childrenOf(child)) children.push(elem);
    } else {
      children.push(child);
    }
  return children;
}

/** Extract *element* children from parent node. */
export function directChildrenOf(elem: DomNode): (DomElement | DomNode[])[] {
  // extract all children nodes
  const children: DomNode[] = [];
  if (Array.isArray(elem)) {
    for (const child of elem) children.push(child);
  } else if ((elem as Maybe<DomElement>)?.type) {
    const theElem = elem as Maybe<DomElement>;
    const props = theElem?.props as Maybe<Dict<string, unknown>>;
    const chs = props?.children as Maybe<DomNode[] | DomNode>;
    // may be a single element
    if (Array.isArray(chs)) {
      for (const ch of chs) children.push(ch);
    } else {
      children.push(chs);
    }
  }

  if (children.length <= 0) return [];
  // filter children with element signatures or fragment signatures
  const result: (DomElement | DomNode[])[] = [];
  for (const child of children)
    if ((child as Maybe<DomElement>)?.type) {
      result.push(child as DomElement);
    } else if (Array.isArray(child)) {
      result.push(child as DomNode[]);
    }
  return result;
}

/** Change the children element definition list to a new one. */
export function setDirectChildrenOf(
  elem: DomNode,
  children: JSX.Element[]
): void {
  if (!(elem as Maybe<DomElement>)?.type) return;
  const theElem = elem as DomElement;
  const props = theElem.props as Maybe<Dict<string, unknown>>;
  theElem.props = {
    ...props,
    children: children.slice(),
  };
  return;
}

/** Throws a 'SemanticElement' parser error. */
export function throwSemError(message: string): never {
  throw Error(message);
}
