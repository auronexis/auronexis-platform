import { AvatarFallback } from "@/components/branding/avatar-fallback";

type ProfileAvatarProps = {
  name: string;
  size?: "md" | "lg";
  className?: string;
};

export function ProfileAvatar({ name, size = "lg", className }: ProfileAvatarProps) {
  return <AvatarFallback name={name} size={size === "lg" ? "lg" : "md"} className={className} />;
}
