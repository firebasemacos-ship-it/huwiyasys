import Image from "next/image";

export function Logo(props: Omit<React.ComponentProps<"div">, 'children'>) {
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
      src="https://i.ibb.co/QqjQT0T/1.png"
      alt="Card Logo"
      priority
      {...props}
    />
  );
}
