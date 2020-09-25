export const React = {
  createElement(name: string, props: { [id: string]: string }, ...content: string[]) {
    props = props || {};
    const propsstr = Object.keys(props)
      .map((key) => {
        const value = props[key];
        return (key === "className")
          ? ` class="${value}"`
          : ` ${key}="${value}"`;
      })
      .join("");
    return `<${name}${propsstr}>${content.join("")}</${name}>`;
  }
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key:string]:any;
      button: any;
      div: any;
      h1: any;
      p: any;
    }
  }
}