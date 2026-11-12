// Generated: every lucide icon the prototype uses, wrapped so it takes the surrounding text colour like currentColor.
import * as L from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

import { withIcon, type IconProps } from "./iconbase";
import { tw } from "@/lib/tw";
import { useEnv, useInherit } from "./rn";

export type { LucideIcon, IconProps } from "./iconbase";

export const Archive = withIcon(L.Archive);
export const ArrowRight = withIcon(L.ArrowRight);
export const BadgeCheck = withIcon(L.BadgeCheck);
export const BatteryFull = withIcon(L.BatteryFull);
export const Bell = withIcon(L.Bell);
export const Bold = withIcon(L.Bold);
export const BookOpen = withIcon(L.BookOpen);
export const Bot = withIcon(L.Bot);
export const CalendarCheck = withIcon(L.CalendarCheck);
export const CalendarDays = withIcon(L.CalendarDays);
export const Camera = withIcon(L.Camera);
export const Check = withIcon(L.Check);
export const CheckSquare = withIcon(L.CheckSquare);
export const ChevronDown = withIcon(L.ChevronDown);
export const ChevronLeft = withIcon(L.ChevronLeft);
export const ChevronRight = withIcon(L.ChevronRight);
export const Coffee = withIcon(L.Coffee);
export const Download = withIcon(L.Download);
export const Eraser = withIcon(L.Eraser);
export const Eye = withIcon(L.Eye);
export const EyeOff = withIcon(L.EyeOff);
export const FileSignature = withIcon(L.FileSignature);
export const FileSpreadsheet = withIcon(L.FileSpreadsheet);
export const FileText = withIcon(L.FileText);
export const FolderOpen = withIcon(L.FolderOpen);
export const Heading2 = withIcon(L.Heading2);
export const House = withIcon(L.House);
export const Inbox = withIcon(L.Inbox);
export const Info = withIcon(L.Info);
export const KeyRound = withIcon(L.KeyRound);
export const LayoutGrid = withIcon(L.LayoutGrid);
export const Link2 = withIcon(L.Link2);
export const List = withIcon(L.List);
export const ListChecks = withIcon(L.ListChecks);
export const Lock = withIcon(L.Lock);
export const LogOut = withIcon(L.LogOut);
export const Mail = withIcon(L.Mail);
export const MapPin = withIcon(L.MapPin);
export const Megaphone = withIcon(L.Megaphone);
export const MessageCircle = withIcon(L.MessageCircle);
export const Mic = withIcon(L.Mic);
export const MicOff = withIcon(L.MicOff);
export const MoreHorizontal = withIcon(L.MoreHorizontal);
export const NotebookPen = withIcon(L.NotebookPen);
export const Palette = withIcon(L.Palette);
export const Paperclip = withIcon(L.Paperclip);
export const Pause = withIcon(L.Pause);
export const PenLine = withIcon(L.PenLine);
export const Pencil = withIcon(L.Pencil);
export const Phone = withIcon(L.Phone);
export const PhoneOff = withIcon(L.PhoneOff);
export const Play = withIcon(L.Play);
export const Plus = withIcon(L.Plus);
export const Quote = withIcon(L.Quote);
export const Receipt = withIcon(L.Receipt);
export const RefreshCw = withIcon(L.RefreshCw);
export const Rocket = withIcon(L.Rocket);
export const RotateCcw = withIcon(L.RotateCcw);
export const ScanFace = withIcon(L.ScanFace);
export const ScanLine = withIcon(L.ScanLine);
export const ScrollText = withIcon(L.ScrollText);
export const Search = withIcon(L.Search);
export const Send = withIcon(L.Send);
export const Settings = withIcon(L.Settings);
export const Share2 = withIcon(L.Share2);
export const ShieldAlert = withIcon(L.ShieldAlert);
export const ShieldCheck = withIcon(L.ShieldCheck);
export const Signal = withIcon(L.Signal);
export const Square = withIcon(L.Square);
export const SquareCheckBig = withIcon(L.SquareCheckBig);
export const Star = withIcon(L.Star);
export const TriangleAlert = withIcon(L.TriangleAlert);
export const Upload = withIcon(L.Upload);
export const Users = withIcon(L.Users);
export const Video = withIcon(L.Video);
export const VideoOff = withIcon(L.VideoOff);
export const Volume2 = withIcon(L.Volume2);
export const VolumeX = withIcon(L.VolumeX);
export const Wallet = withIcon(L.Wallet);
export const Wifi = withIcon(L.Wifi);
export const WifiOff = withIcon(L.WifiOff);
export const X = withIcon(L.X);
export const ImageIcon = withIcon(L.Image);

/** lucide v1 dropped brand glyphs; these two are filled paths drawn at 24px. */
function brand(d: string) {
  return function Brand({ size = 24, className, style, color }: IconProps) {
    const env = useEnv();
    const h = useInherit();
    const p = tw(className, env);
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ flexShrink: 0 }, p.style, style] as never}>
        <Path d={d} fill={color ?? p.inherit.color ?? h.color ?? env.c.ink} />
      </Svg>
    );
  };
}
export const Github = brand("M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z");
export const Linkedin = brand("M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z");
