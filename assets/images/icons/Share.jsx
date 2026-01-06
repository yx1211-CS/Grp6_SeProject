import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Share = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M3 13.5v3.75c0 1.243 0 1.864.387 2.25.386.387 1.008.387 2.251.387h12.724c1.243 0 1.864 0 2.251-.387.387-.386.387-1.007.387-2.25v-3.75"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 14V2.5m0 0l-4.5 4.5M12 2.5l4.5 4.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Share