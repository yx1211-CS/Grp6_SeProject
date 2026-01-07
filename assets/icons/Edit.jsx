import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Edit = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M13.5 6L6 13.5V18h4.5l7.5-7.5m3-3l-3-3m-12 12H3m16.5-13.5l2.25 2.25"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Edit