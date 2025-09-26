import Image from "next/image";

export function Logo(props: React.ComponentProps<typeof Image>) {
  return (
    <Image
      src="https://i.ibb.co/xtzts1VC/Purple-and-White-Modern-Robot-Illustration-Technology-Logo.png"
      alt="Logo"
      width={48}
      height={48}
      priority
      {...props}
    />
  );
}
