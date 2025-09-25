import Image from "next/image";

export function Logo(props: React.ComponentProps<typeof Image>) {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={48}
      height={48}
      priority
      {...props}
    />
  );
}
