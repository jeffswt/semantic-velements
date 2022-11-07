import {
  childrenOf,
  directChildrenOf,
  DomElement,
  DomNode,
  ofAnyComponent,
  ofComponent,
  throwSemError,
  typedChildrenOf,
} from "./jsx-dom";
import {
  ILayoutProps,
  IStructureProps,
  Layout,
  SemanticPortal,
  Structure,
} from "./semantic-nodes";
import { Dict, Maybe } from "./types";

interface ParsedElement {
  structure: DomElement<IStructureProps>;
  /**
   * If {layouts} is undefined, element SHOULD fallback to rendering the
   * structure. This is used for sole {Structure} definitions which does not
   * involve a {Layout} definition.
   */
  layouts?: ParsedLayout[];
}

interface ParsedStructure {
  /** Mapping from {Structure} node identifiers to the nodes. */
  keys: Dict<string, StructureNode>;
  /** Direct children of the structure root. */
  children: StructureNode[];
}

interface StructureNode {
  /** Identifier given to that node. */
  key: string;
  /** The element describing the semantic structure. */
  element: DomElement;
  /** Parent of this structure node, if any. */
  parent: Maybe<StructureNode>;
  /** Children of this structure node. */
  children: StructureNode[];
}

interface ParsedLayout {
  rule: string;
  elements: DomNode[];
}

/** Converts a 'SemanticElement' into an internal element representation. */
function parseComponentDefinition(elem: DomNode): ParsedElement {
  // divergent root types
  const portal = ofComponent(elem, SemanticPortal);
  const structure = ofComponent(elem, Structure);
  let result: ParsedElement;

  // split structure and layout
  if (portal) {
    const structures = typedChildrenOf(portal, Structure);
    const layouts = typedChildrenOf(portal, Layout);
    // check for occurrences
    if (structures.length !== 1)
      throwSemError(`component ${elem} expects exactly 1 structure definition`);
    if (layouts.length < 1)
      throwSemError(`component ${elem} expects at least 1 layout definition`);
    // collect
    result = {
      structure: structures[0],
      layouts: layouts.map((child) => parseLayout(child)),
    };
  } else if (structure) {
    result = {
      structure: structure,
      layouts: undefined,
    };
  } else {
    throwSemError(`component ${elem} is not a semantic element`);
  }

  // analyze structure and check for errors
  const tree = parseStructure(result.structure);

  return {};
}

/**
 * Parses and validates the structure definition. Interestingly, non-elements
 * are automatically ignored (permissively), which won't cause errors if some
 * {undefined} or else were fed to it.
 */
function parseStructure(
  elem: DomElement<IStructureProps>
): ParsedStructure | never {
  // define element manifest
  const keys: Dict<string, StructureNode> = {};

  // process children recursively
  function dfs(node: DomNode): StructureNode {
    node = ofAnyComponent(node);
    if (!node) throwSemError(`<Structure /> should only contain elements`);
    const props = node.props as Maybe<Dict<string, unknown>>;
    // extract element key
    const key = props?.key as Maybe<string>;
    if (!key) throwSemError(`<Structure /> elements must have key identifiers`);
    if (keys[key]) throwSemError(`<Structure /> has duplicate key: '${key}'`);
    // extract children
    const children = childrenOf(node).map((ch) => dfs(ch));
    // collect structure node
    const result: StructureNode = {
      key: key,
      element: node,
      parent: undefined,
      children: children,
    };
    for (const ch of result.children) ch.parent = result;
    keys[key] = result;
    return result;
  }
  const children = childrenOf(elem).map((ch) => dfs(ch));

  // collect result
  return {
    keys: keys,
    children: children,
  };
}

/** Simply extract the properties out of the {Layout} definition. */
function parseLayout(elem: DomElement<ILayoutProps>): ParsedLayout {
  return {
    rule: elem.props.rule,
    elements: childrenOf(elem),
  };
}

/**
 * Connect parsed {Layout} to corresponding {Structure} nodes. Everything
 * matching the structure node will be replaced with the rendered result. It is
 * also required that:
 *
 *  1. Each semantic element in the {Structure} must correspond to at most 1
 *     element (we call it an {Anchor}) in the {Layout} with the same key.
 *  2. No {Anchor} in the {Layout} has any children. This is never enforced but
 *     doing so has absolutely no effect on the procedures since they'll never
 *     get noticed.
 *  3. If an {Anchor} in the {Layout} corresponds to a {Structure} node, that
 *     node must be a direct child of the {Structure} root. This means that we
 *     only process direct subtree roots of the {Structure}.
 *
 * @note Fragments may be split open during this process, particularly if some
 *       children of that fragment was connected to a structure node.
 */
function connectLayout(structure: ParsedStructure, layout: ParsedLayout): void {
  // retrieve keys for root's children
  const keys: Dict<string, StructureNode> = {};
  for (const ch of structure.children) keys[ch.key] = ch;
  // already-matched keys
  const matched: Dict<string, DomElement> = {};

  // dfs goes through layout recursively to find matching keys, returning
  // {undefined} if the subtree root is to be kept unchanged, or the newly
  // created subtree root to replace the old one
  function dfs(node: DomNode): Maybe<DomNode> {
    // process current node
    const elem = ofAnyComponent(node);
    if (elem) {
      const props = elem.props as Maybe<Dict<string, unknown>>;
      const key = props?.key as Maybe<string>;
      // node matches one of the structure nodes
      if (key !== undefined && structure.keys[key]) {
        if (!keys[key]) throwSemError(`layout node '${key}' is too deep`);
        if (matched[key]) throwSemError(`duplicate layout node '${key}'`);
        const converted: DomElement = null;
        // mark key as used
        matched[key] = converted;
        return converted;
      }
    }
    // go through children
    let childrenChanged = false;
    const newChildren: DomNode[] = [];
    for (const ch of directChildrenOf(node)) {
      const newCh = dfs(ch);
      if (newCh !== undefined) {
        childrenChanged = true;
        newChildren.push(newCh);
      } else {
        newChildren.push(ch);
      }
    }
    // make changes to children if something's changed
    if (childrenChanged)
      if (elem) {
        const props = elem.props as Dict<string, unknown>; // must have children
        props.children = newChildren;
      } else if (Array.isArray(elem)) {
        return newChildren;
      }
    return;
  }
}
