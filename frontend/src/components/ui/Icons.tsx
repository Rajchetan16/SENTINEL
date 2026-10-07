import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>
export function ArrowIcon(props: Props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
export function LensMark(props: Props) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" />
      <ellipse
        cx="16"
        cy="16"
        rx="7"
        ry="12.5"
        stroke="currentColor"
        transform="rotate(42 16 16)"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  )
}
export function GithubIcon(props: Props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9 19c-4.3 1.3-4.3-2.2-6-2.7m12 5v-3.5c0-1 .1-1.5-.5-2.2 3.3-.4 6.7-1.6 6.7-7.2a5.6 5.6 0 0 0-1.5-3.9 5.2 5.2 0 0 0-.2-3.8S18.3.3 15.4 2a13.5 13.5 0 0 0-6.8 0C5.7.3 4.5.7 4.5.7a5.2 5.2 0 0 0-.2 3.8 5.6 5.6 0 0 0-1.5 3.9c0 5.6 3.4 6.8 6.7 7.2-.6.6-.6 1.2-.5 2.2v3.5"
        transform="translate(1 1) scale(.9)"
      />
    </svg>
  )
}
