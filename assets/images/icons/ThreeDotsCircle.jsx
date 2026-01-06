import * as React from "react"
import Svg, { Path, Circle } from "react-native-svg"

const ThreeDotsCircle = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Circle cx="12" cy="12" r="10" stroke={props.color || "currentColor"} strokeWidth={props.strokeWidth || 1.5} />
    <Path d="M11.9959 12H12.0049" stroke={props.color || "currentColor"} strokeWidth={props.strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M11.9959 16H12.0049" stroke={props.color || "currentColor"} strokeWidth={props.strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M11.9959 8H12.0049" stroke={props.color || "currentColor"} strokeWidth={props.strokeWidth || 1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export default ThreeDotsCircle