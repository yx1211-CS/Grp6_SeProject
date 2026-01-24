import Svg, { Path } from "react-native-svg";

const Fire = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    color="#000000"
    fill="none"
    {...props}
  >
    <Path
      d="M12 22c5.523 0 10-4.477 10-10a10 10 0 00-10-10C6.477 2 2 6.477 2 12a10 10 0 0010 10z" // Optional circle background or...
      fill="transparent"
    />
    {/* Actual Flame Path */}
    <Path
      d="M8.5 14.5A2.5 2.5 0 0011 17c1.38 0 2.5-1.12 2.5-2.5 0-1.38-.5-2-1.5-3 1-.3 1.5-1.5 1.5-2.5 0-2-2.5-4-4.5-5 .5 1.5 0 3-1 4-1.2 1.2-2.5 2.5-2.5 4a3.5 3.5 0 003 2.5zM12 22c4 0 7-3 7-8 0-4-3-6-3-6s-1 2-2 3c0-2-1-4-3-5 0 2-2 3-3 4-2 2-2 5 0 7 1 1.5 2.5 5 4 5z"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 0.5}
      fill={props.fill || "#fc0202"} // Allows you to fill it with color
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Fire;
