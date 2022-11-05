import React, { Fragment } from "react";
import { Maybe } from "./types";

/** A non-iterable React node. */
export type DomNode =
  | React.ReactElement
  | string
  | number
  | React.ReactPortal
  | boolean
  | null
  | undefined;

type DomElement<P = {}> = React.ReactElement<P>;

/** Check whether an element is generated from a given function. */
export function elementIs<P = {}>(
  elem: DomNode,
  component: React.ComponentType<P>
): boolean {
  return (elem as Maybe<DomElement>)?.type === component;
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
    if (Array.isArray(child)) {
      for (const grandchild of child)
        for (const descendant of childrenOf(grandchild))
          children.push(descendant);
    } else if (child.type === Fragment) {
      for (const descendant of childrenOf(child)) children.push(descendant);
    } else {
      children.push(child);
    }
  return children;
}

/** Extract *element* children from parent node. */
export function directChildrenOf(elem: DomNode): (DomElement | DomNode[])[] {
  const props = (elem as Maybe<DomElement>)?.props as Maybe<
    Record<string, unknown>
  >;
  if (!props?.children) return [];
  // the 'React.ReactNode' may be not iterable
  let children: DomNode[];
  if (Array.isArray(props.children)) {
    children = props.children;
  } else {
    children = [props.children as DomNode];
  }
  // only those with a element signature, or is a fragment may be kept.
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
  const props = theElem.props as Maybe<Record<string, unknown>>;
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
