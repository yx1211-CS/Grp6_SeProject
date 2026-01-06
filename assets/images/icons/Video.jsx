import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Video = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M17 17.5V13.5C17 12.6716 17.6716 12 18.5 12C19.3284 12 20 12.6716 20 13.5V17.5C20 19.433 18.433 21 16.5 21H7.5C5.567 21 4 19.433 4 17.5V13.5C4 11.567 5.567 10 7.5 10H14.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 6L10.5 8.5L7 6V11.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Video