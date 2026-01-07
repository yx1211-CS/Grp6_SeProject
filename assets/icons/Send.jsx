import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Send = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M21.66 10.44l-16.7-7.5a1.6 1.6 0 0 0-2.22 1.76l2.12 7.8 2.12 7.8a1.6 1.6 0 0 0 2.22 1.76l16.7-7.5a1.6 1.6 0 0 0 0-2.88l-14.58-2.65ZM4.96 4.7l14.58 6.55L4.96 17.8"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.08 12h8.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Send