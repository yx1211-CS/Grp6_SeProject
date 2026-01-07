import * as React from "react"
import Svg, { Path } from "react-native-svg"

const Mail = (props) => (
  <Svg
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    fill="none"
    {...props}
  >
    <Path
      d="M21.589 10.97c-.012-.662-.125-1.253-.335-1.78a4.9 4.9 0 0 0-3.328-2.92C17.307 6.07 16.536 6 15.65 6h-7.3c-.886 0-1.657.07-2.276.27A4.9 4.9 0 0 0 2.746 9.19c-.21.527-.323 1.118-.335 1.78-.005.286-.005.586-.005.9v2.26c0 1.33.01 2.378.188 3.207.195.908.636 1.727 1.272 2.363.636.636 1.455 1.077 2.363 1.272.829.178 1.877.188 3.207.188h4.528c1.33 0 2.378-.01 3.207-.188.908-.195 1.727-.636 2.363-1.272.636-.636 1.077-1.455 1.272-2.363.178-.829.188-1.877.188-3.207V11.87c0-.314 0-.614-.005-.9Z"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 14c-2.07 0-3.92-1.04-5.26-2.55-.44-.5-.95-1.12-1.24-1.55a1.21 1.21 0 0 1 .18-1.58c.21-.21.78-.09 1.13-.02a9.5 9.5 0 0 1 10.38 0c.35-.07.92-.19 1.13.02.32.33.39.95.18 1.58-.29.43-.8 1.05-1.24 1.55C15.92 12.96 14.07 14 12 14Z"
      stroke={props.color || "currentColor"}
      strokeWidth={props.strokeWidth || 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default Mail