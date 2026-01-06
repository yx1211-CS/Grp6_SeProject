import * as React from "react"
import Svg, { Path, Circle } from "react-native-svg"

const User = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M12.002 21.5c-4.321 0-7.071-.852-8.35-2.585-.802-1.087-.802-2.316 0-3.403 1.279-1.733 4.029-2.585 8.35-2.585 4.322 0 7.072.852 8.35 2.585.803 1.087.803 2.316 0 3.403-1.278 1.733-4.028 2.585-8.35 2.585Z"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="7"
      r="4.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default User