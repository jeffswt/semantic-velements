import { Fragment } from "react";
import { Maybe } from "./types";

/** Extract children of JSX element, disregarding fragments. */
export function childrenOf(elem: JSX.Element): JSX.Element[] {
  const directChildren = directChildrenOf(elem);
  const children: JSX.Element[] = [];
  for (const child of directChildren)
    if (child.type !== Fragment) {
      children.push(child);
    } else {
      for (const descendant of childrenOf(child)) children.push(descendant);
    }
  return children;
}

/** Extract children of JSX element exactly as defined in the code. */
export function directChildrenOf(elem: JSX.Element): JSX.Element[] {
  const props = elem.props as Maybe<Record<string, unknown>>;
  if (!props?.children) return [];
  const children = props.children as JSX.Element[];
  return children.filter((child) => child.type);
}

/** Change the children element definition list to a new one. */
export function setDirectChildrenOf(
  elem: JSX.Element,
  children: JSX.Element[]
): void {
  const props = elem.props as Maybe<Record<string, unknown>>;
  if (!props?.type) return; // not safe
  props.children = children.slice();
  return;
}
