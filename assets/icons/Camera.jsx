import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Camera = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M13.5 10.5V6.75a2.25 2.25 0 0 0-2.25-2.25H4.25A2.25 2.25 0 0 0 2 6.75v10.5A2.25 2.25 0 0 0 4.25 19.5h7a2.25 2.25 0 0 0 2.25-2.25V13.5m0-3l6.096-3.658a1.5 1.5 0 0 1 2.27 1.287v7.742a1.5 1.5 0 0 1-2.27 1.287L13.5 13.5m0-3V13.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Camera