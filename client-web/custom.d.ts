declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.vert' {
  const classes: string;
  export default classes;
}

declare module '*.frag' {
  const classes: string;
  export default classes;
}

declare module '*.svg' {
  const classes: string;
  export default classes;
}
