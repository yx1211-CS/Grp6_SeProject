import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Call = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M21.5 16.5c-1.396 0-2.793-.42-3.876-1.259a2.035 2.035 0 0 0-2.454.218l-1.468 1.468c-2.433-1.07-4.24-3.132-5.116-5.748l1.378-1.378a2.032 2.032 0 0 0 .265-2.228A7.85 7.85 0 0 0 9.172 3.5C8.36 2.548 7.397 2.022 6.5 2.022c-3.12 0-4.48 2.5-4.48 2.5.586 7.427 6.474 13.315 13.9 13.9 0 0 2.5-1.36 2.5-4.48 0-.897-.525-1.86-1.478-2.673l-.442.231Z"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Call