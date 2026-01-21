import Svg, { Path } from "react-native-svg";

const ArrowRight = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={props.width || 24}
    height={props.height || 24}
    fill="none"
    stroke={props.color || "currentColor"}
    strokeWidth={props.strokeWidth || 1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

export default ArrowRight;
