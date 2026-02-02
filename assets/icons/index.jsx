import { Feather } from "@expo/vector-icons"; //防闪退的
import React from "react";
import { theme } from "../../constants/theme";
import ArrowLeft from "./ArrowLeft";
import ArrowRight from "./ArrowRight";
import Call from "./Call";
import Camera from "./Camera";
import Comment from "./Comment";
import Delete from "./Delete";
import Edit from "./Edit";
import Fire from "./Fire";
import Heart from "./Heart";
import Home from "./Home";
import Image from "./Image";
import Location from "./Location";
import Lock from "./Lock";
import Logout from "./Logout";
import Mail from "./Mail";
import Plus from "./Plus";
import Search from "./Search";
import Send from "./Send";
import Share from "./Share";
import Shield from "./Shield";
import ThreeDotsCircle from "./ThreeDotsCircle";
import ThreeDotsHorizontal from "./ThreeDotsHorizontal";
import User from "./User";
import Video from "./Video";
import ExclamationCircle from './ExclamationCircle';
import Sync from './Sync';
import ArrowDown from './ArrowDown';

const icons = {
  home: Home,
  mail: Mail,
  lock: Lock,
  user: User,
  heart: Heart,
  plus: Plus,
  fire: Fire,
  search: Search,
  location: Location,
  call: Call,
  camera: Camera,
  edit: Edit,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowDown: ArrowDown,
  threeDotsCircle: ThreeDotsCircle,
  threeDotsHorizontal: ThreeDotsHorizontal,
  comment: Comment,
  share: Share,
  send: Send,
  delete: Delete,
  logout: Logout,
  image: Image,
  video: Video,
  shield: Shield,
  "exclamation-circle": ExclamationCircle,
  sync: Sync,
};

const Icon = ({ name, ...props }) => {
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icons object.`);
    return <Feather name="help-circle" size={props.size || 24} color="gray" />;
  }

  return (
    <IconComponent
      height={props.size || 24}
      width={props.size || 24}
      strokeWidth={props.strokeWidth || 1.9}
      color={theme.colors.textLight}
      {...props}
    />
  );
};

export default Icon;
