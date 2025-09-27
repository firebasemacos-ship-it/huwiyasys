import Image from "next/image";

export function Logo(props: React.ComponentProps<typeof Image>) {
  return (
    <Image
      src="https://i.ibb.co/QqjQT0T/1.png"
      alt="Logo"
      width={48}
      height={48}
      priority
      {...props}
    />
  );
}

export function CardLogo(props: React.ComponentProps<typeof Image>) {
  return (
    <Image
      src="https://i.ibb.co/TBGhJqp1/cart-logo.png"
      alt="Card Logo"
      width={48}
      height={48}
      priority
      {...props}
    />
  );
}
