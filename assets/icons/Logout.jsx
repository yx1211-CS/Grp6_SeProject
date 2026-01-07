import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Logout = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M15 12L2 12M2 12L6 9M2 12L6 15"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 5C9 3.89543 9.89543 3 11 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H11C9.89543 21 9 20.1046 9 19"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Logout