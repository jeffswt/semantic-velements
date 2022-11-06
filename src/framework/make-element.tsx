import React from "react";

interface ISemElemInterconnect {
  /** Rerender the renderer element with a new element. */
  reRender?: (elem: JSX.Element) => void;
}

interface ISemElemVertexProps {
  /** A reference shared with the renderer component triggering updates. */
  interconnect: ISemElemInterconnect;
}

/** The delegate managing semantic element states. */
function SemElemVertex(props: ISemElemVertexProps): JSX.Element {
  return <></>;
}

interface ISemElemRendererProps {
  /** The next element to be rendered. */
  renderingElement?: JSX.Element;
  /** A reference shared with the vertex component triggering updates. */
  interconnect: ISemElemInterconnect;
}

interface ISemElemRendererState extends ISemElemRendererProps {
  /** Forcefully update value. */
  lifetimeCounter: number;
}

/** The delegate that holds responsible for rendering layouts. */
class SemElemRenderer extends React.Component<
  ISemElemRendererProps,
  ISemElemRendererState
> {
  constructor(props: ISemElemRendererProps) {
    super(props);
    this.state = {
      renderingElement: props.renderingElement,
      interconnect: props.interconnect,
      lifetimeCounter: 0,
    };
    // attach re-render caller
    this.state.interconnect.reRender = (elem) =>
      this.setState((prevState) => {
        return {
          ...prevState,
          renderingElement: elem,
          lifetimeCounter: prevState.lifetimeCounter + 1,
        };
      });
    return this;
  }

  render(): JSX.Element {
    return this.state.renderingElement ?? <></>;
  }
}
