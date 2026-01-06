import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Delete = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 17.7723 20.1835C16.9018 21 15.6185 21 13.0518 21H10.9482C8.38153 21 7.09819 21 6.22767 20.1835C5.35715 19.3671 5.27806 18.0864 5.11971 15.5251L4.5 5.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C13.9106 2.1051 13.3915 2.1051 12.3533 2.1051C11.3151 2.1051 10.796 2.1051 10.4049 2.39681C10.0138 2.68852 9.78705 3.15626 9.33353 4.09173L8.65088 5.5"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Delete