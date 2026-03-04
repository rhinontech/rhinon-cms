import { SVGProps } from "react";
import { BiPlanet, BiSolidPlanet } from "react-icons/bi";

type IconProps = SVGProps<SVGSVGElement> & {
  isActive?: boolean;
};

export const ChatIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-messages-square ${props.className ?? ""}`}
      {...props}
    >
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  );
};

export const TicketIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-ticket-icon lucide-ticket ${props.className ?? ""
        }`}
      {...props}
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
};

export const SupportIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-headset-icon lucide-headset ${props.className ?? ""
        }`}
      {...props}
    >
      <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
    </svg>
  );
};

export const LayoutDashboardIcon = ({
  isActive = false,
  ...props
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-layout-dashboard ${props.className ?? ""}`}
      {...props}
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
};

export const ZapIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-zap-icon lucide-zap ${props.className ?? ""}`}
      {...props}
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
};

export const MouseClickIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-mouse-pointer-click-icon lucide-mouse-pointer-click ${props.className ?? ""
        }`}
      {...props}
    >
      <path d="M14 4.1 12 6" />
      <path d="m5.1 8-2.9-.8" />
      <path d="m6 12-1.9 2" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
    </svg>
  );
};

export const BookOpenIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-book-open-icon lucide-book-open ${props.className ?? ""
        }`}
      {...props}
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
};

export const UsersIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-users-icon lucide-users ${props.className ?? ""
        }`}
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
};

export const CrmIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={isActive ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-user-cog-icon lucide-user-cog ${props.className ?? ""
        }`}
      {...props}
    >
      <path d="M10 15H6a4 4 0 0 0-4 4v2" />
      <path d="m14.305 16.53.923-.382" />
      <path d="m15.228 13.852-.923-.383" />
      <path d="m16.852 12.228-.383-.923" />
      <path d="m16.852 17.772-.383.924" />
      <path d="m19.148 12.228.383-.923" />
      <path d="m19.53 18.696-.382-.924" />
      <path d="m20.772 13.852.924-.383" />
      <path d="m20.772 16.148.924.383" />
      <circle cx="18" cy="15" r="3" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
};

export const CreditCardIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-credit-card-icon lucide-credit-card ${props.className ?? ""
        }`}
      {...props}
    >
      {/* Card outline */}
      <rect width="20" height="14" x="2" y="5" rx="2" />

      {/* Top stripe */}
      <line x1="2" x2="22" y1="10" y2="10" />

      {/* Bottom fill when active */}
      {isActive && (
        <rect x="2" y="10" width="20" height="9" rx="0" fill="currentColor" />
      )}
    </svg>
  );
};

export const SettingsIcon = ({ isActive = false, ...props }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-settings-icon lucide-settings ${props.className ?? ""
        }`}
      {...props}
    >
      {/* Gear shape path for masking */}
      {isActive ? (
        <>
          <defs>
            <mask id="gear-mask">
              {/* Full white background (shows everything) */}
              <rect width="24" height="24" fill="white" />
              {/* Black circle (hides this area) */}
              <circle cx="12" cy="12" r="3" fill="black" />
            </mask>
          </defs>
          {/* Filled gear with hole in center using mask */}
          <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            fill="currentColor"
            mask="url(#gear-mask)"
          />
        </>
      ) : (
        <>
          {/* Outline gear only when inactive */}
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        </>
      )}

      {/* Always draw the circle stroke */}
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" />
    </svg>
  );
};

export const seoAnalyticsIcon = ({ isActive = false, ...props }: IconProps) => {
  return isActive ? (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      id="Seo-Fill--Streamline-Remix-Fill"
      height="24"
      width="24"
      {...props}
    >
      <path
        d="M8 3c-3.86599 0 -7 3.13401 -7 7 0 3.866 3.13401 7 7 7h1.07089C9.02417 16.6734 9 16.3395 9 16s0.02417 -0.6734 0.07089 -1H8c-2.76142 0 -5 -2.2386 -5 -5 0 -2.76142 2.23858 -5 5 -5h8c2.7614 0 5 2.23858 5 5 0 0.3428 -0.0345 0.6775 -0.1002 1.0008 0.5855 0.574 1.0706 1.25 1.4266 1.9992 0.4319 -0.9093 0.6736 -1.9264 0.6736 -3 0 -3.86599 -3.134 -7 -7 -7H8Zm3 13c0 -2.7614 2.2386 -5 5 -5s5 2.2386 5 5c0 1.0191 -0.3049 1.967 -0.8284 2.7574l2.5355 2.5355 -1.4142 1.4142 -2.5355 -2.5355C17.967 20.6951 17.0191 21 16 21c-2.7614 0 -5 -2.2386 -5 -5Z"
        strokeWidth="1"
      ></path>
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      width="24"
      {...props}
    >
      <path
        d="M8 3c-3.86599 0 -7 3.13401 -7 7 0 3.866 3.13401 7 7 7h1.07089C9.02417 16.6734 9 16.3395 9 16s0.02417 -0.6734 0.07089 -1H8c-2.76142 0 -5 -2.2386 -5 -5 0 -2.76142 2.23858 -5 5 -5h8c2.7614 0 5 2.23858 5 5 0 0.3428 -0.0345 0.6775 -0.1002 1.0008 0.5855 0.574 1.0706 1.25 1.4266 1.9992 0.4319 -0.9093 0.6736 -1.9264 0.6736 -3 0 -3.86599 -3.134 -7 -7 -7H8Zm8 10c-1.6569 0 -3 1.3431 -3 3s1.3431 3 3 3 3 -1.3431 3 -3 -1.3431 -3 -3 -3Zm-5 3c0 -2.7614 2.2386 -5 5 -5s5 2.2386 5 5c0 1.0191 -0.3049 1.967 -0.8284 2.7574l2.5355 2.5355 -1.4142 1.4142 -2.5355 -2.5355C17.967 20.6951 17.0191 21 16 21c-2.7614 0 -5 -2.2386 -5 -5Z"
        strokeWidth="1"
      ></path>
    </svg>
  );
};

export const GoogleIcon = () => (
  <svg
    width="20px"
    height="20px"
    viewBox="-3 0 262 262"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
  >
    <path
      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      fill="#4285F4"
    />
    <path
      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      fill="#34A853"
    />
    <path
      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
      fill="#FBBC05"
    />
    <path
      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      fill="#EB4335"
    />
  </svg>
);

export const MicrosoftIcon = () => (
  <svg
    viewBox="0 0 129 129"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    width="20px"
    height="20px"
  >
    <path fill="#F25022" d="M0,0h61.3v61.3H0V0z" />
    <path fill="#7FBA00" d="M67.7,0H129v61.3H67.7V0z" />
    <path fill="#00A4EF" d="M0,67.7h61.3V129H0V67.7z" />
    <path fill="#FFB900" d="M67.7,67.7H129V129H67.7V67.7z" />
  </svg>
);

export const LinkedInIcon = () => (
  <svg
    width="20px"
    height="20px"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="#0A66C2"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export const CrmNotePlaceholders = () => (
  <svg
    width="80px"
    height="80px"
    viewBox="-2.4 -2.4 28.80 28.80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="#000000"
    transform="rotate(0)"
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="#ffffff"
      strokeWidth="0.768"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <path
        d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 10.1786 21.513 8.47087 20.6622 7"
        stroke="#9e9e9e"
        strokeWidth="1.9919999999999998"
        strokeLinecap="round"
      ></path>{" "}
      <path
        d="M8 12H8.009M11.991 12H12M15.991 12H16"
        stroke="#9e9e9e"
        strokeWidth="1.9919999999999998"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>{" "}
    </g>
  </svg>
);

export const CollaborationIcon = ({ isActive = false }: IconProps) => {
  return isActive ? (
    <BiSolidPlanet size={40} />
  ) : (
    <BiPlanet size={40} />
  );
};
