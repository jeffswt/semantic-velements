import { Fragment } from "react";

interface ISemanticPortalProps {
  /**
   * Bridges the semantic application tree with the outside world that are not
   * defined in such a way. Things dirty are getting in through {Layout}
   * definitions here, and it's your job to keep them out of the semantic
   * structure tree.
   *
   * Children of this element must hold exactly 1 {Structure} definition and at
   * least 1 {Layout} definitions. It must be further noted that {Layout}
   * definitions should cover all possible cases, and are matched in the order
   * of definition.
   */
  children?: React.ReactNode;
}

export function SemanticPortal(props: ISemanticPortalProps): JSX.Element {
  return <Fragment>{props.children}</Fragment>;
}

interface IStructureProps {
  /**
   * A component tree composed entirely of {SemanticElement}s. These elements
   * **must** have {key}s on their properties to match that in the {Layout}.
   */
  children?: React.ReactNode;
}

export function Structure(props: IStructureProps): JSX.Element {
  return <Fragment>{props.children}</Fragment>;
}

interface ILayoutProps {
  /** Rule to match this layout. */
  rule: string;

  /**
   * Elements actually forming the current layout. {SemanticElements} must
   * correspond exactly to the one in the {Structure}, meaning that you should
   * never leave a {SemanticElement} in the {Structure} without a respective
   * {Layout} position, or vice versa, nor could you create such an element
   * with dangling {key}s.
   */
  children?: React.ReactNode;
}

export function Layout(props: ILayoutProps): JSX.Element {
  return <Fragment>{props.children}</Fragment>;
}
