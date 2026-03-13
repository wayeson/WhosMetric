import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function LogoMark({ size = 28, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      {...props}
    >
      {!props["aria-hidden"] && <title>WhosMetric</title>}
      <rect width="100" height="100" rx="18" fill="#1800E0" />
      {/* 4-pointed star sparkle mark */}
      <path
        fill="white"
        d="M50 8 C48 8 45 34 40 42 C34 50 8 48 8 50
           C8 52 34 50 40 58 C45 66 48 92 50 92
           C52 92 55 66 60 58 C66 50 92 52 92 50
           C92 48 66 50 60 42 C55 34 52 8 50 8 Z"
      />
    </svg>
  );
}

export default LogoMark;
