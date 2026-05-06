import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...props }: IconProps): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

export function Leaf(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9h6v6c0 5-4 9-8 10Z" /><path d="M2 22 11 13" /></Icon>;
}

export function Home(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M3 10 12 3l9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" /></Icon>;
}

export function FileText(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" /></Icon>;
}

export function Inbox(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 4h14a2 2 0 0 1 2 1.7l-1.6 8.6a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7L4 5.7A2 2 0 0 1 5 4Z" /></Icon>;
}

export function User(props: IconProps): React.ReactElement {
  return <Icon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>;
}

export function Bell(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>;
}

export function Plus(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function Upload(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Icon>;
}

export function Check(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon>;
}

export function ChevronRight(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="m9 6 6 6-6 6" /></Icon>;
}

export function ChevronLeft(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="m15 6-6 6 6 6" /></Icon>;
}

export function ArrowLeft(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>;
}

export function AlertTriangle(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Icon>;
}

export function Sparkle(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></Icon>;
}

export function BarChart(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-3" /></Icon>;
}

export function Database(props: IconProps): React.ReactElement {
  return <Icon {...props}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0" /></Icon>;
}

export function Building(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" /></Icon>;
}

export function Drop(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M12 2.7s-6 6.5-6 11.3a6 6 0 0 0 12 0c0-4.8-6-11.3-6-11.3Z" /></Icon>;
}

export function Bolt(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></Icon>;
}

export function Camera(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></Icon>;
}

export function MessageCircle(props: IconProps): React.ReactElement {
  return <Icon {...props}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></Icon>;
}

export function Settings(props: IconProps): React.ReactElement {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Icon>;
}
