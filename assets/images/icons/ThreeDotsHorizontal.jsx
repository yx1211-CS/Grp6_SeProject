import * as React from "react"
import Svg, { Path } from "react-native-svg"

const ThreeDotsHorizontal = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M11.9959 12H12.0049"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.9998 12H18.0088"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.99981 12H6.00879"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default ThreeDotsHorizontal