import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Lock = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M6 10V8c0-3.314 2.686-6 6-6s6 2.686 6 6v2c1.47 0 2.115.023 2.616.14.731.17 1.306.745 1.477 1.477.172.736.172 1.742.172 3.755v1.256c0 2.013 0 3.019-.172 3.755-.17.732-.746 1.307-1.477 1.477-.736.172-1.742.172-3.755.172H9.14c-2.013 0-3.019 0-3.755-.172a2.388 2.388 0 0 1-1.477-1.477C3.737 19.65 3.737 18.644 3.737 16.63v-1.256c0-2.013 0-3.019.172-3.755.17-.732.746-1.307 1.477-1.477C5.885 10.023 6.53 10 8 10Z"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 14v3"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Lock