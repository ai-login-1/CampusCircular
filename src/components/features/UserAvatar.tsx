interface UserAvatarProps {
  src: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  isVerified?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

const badgeSizeMap = {
  sm: "w-3 h-3 -bottom-0.5 -right-0.5",
  md: "w-4 h-4 -bottom-0.5 -right-0.5",
  lg: "w-5 h-5 bottom-0 right-0",
  xl: "w-6 h-6 bottom-0.5 right-0.5",
};

export default function UserAvatar({ src, name, size = "md", isVerified }: UserAvatarProps) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div className={`${sizeMap[size]} rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold ring-2 ring-white`}>
          {initials}
        </div>
      )}
      {isVerified && (
        <span className={`${badgeSizeMap[size]} absolute bg-blue-500 rounded-full border-2 border-white flex items-center justify-center`}>
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
          </svg>
        </span>
      )}
    </div>
  );
}
