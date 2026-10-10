import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={68}
      height={36}
      className={cn("block object-contain", className)}
    />
  );
}
