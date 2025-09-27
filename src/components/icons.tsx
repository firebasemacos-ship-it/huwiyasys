import Image from "next/image";

export function Logo(props: Omit<React.ComponentProps<typeof Image>, 'height' | 'width' | 'src' | 'alt'>) {
  return (
    <div {...props} style={{position: 'relative', ...props.style}}>
        <Image
          src="https://i.ibb.co/Qjm6DjjL/logo-hq.png"
          alt="Logo"
          fill
          style={{objectFit: 'contain'}}
          priority
        />
    </div>
  );
}

export function CardLogo(props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
  return (
     <Image
      src="https://i.ibb.co/TBGhJqp1/cart-logo.png"
      alt="Card Logo"
      priority
      {...props}
    />
  );
}
