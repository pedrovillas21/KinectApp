import React from "react";

// Ícones do app vêm de react-native-svg; aqui as mesmas tags viram SVG do DOM.
type P = React.SVGProps<SVGElement> & Record<string, unknown>;
export const Svg = (p: P) => <svg {...(p as React.SVGProps<SVGSVGElement>)} />;
export const Circle = (p: P) => <circle {...(p as React.SVGProps<SVGCircleElement>)} />;
export const Line = (p: P) => <line {...(p as React.SVGProps<SVGLineElement>)} />;
export const Path = (p: P) => <path {...(p as React.SVGProps<SVGPathElement>)} />;
export const Polyline = (p: P) => <polyline {...(p as React.SVGProps<SVGPolylineElement>)} />;
export const Rect = (p: P) => <rect {...(p as React.SVGProps<SVGRectElement>)} />;
