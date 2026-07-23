export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4 6H16M8 6V4.5C8 4.22386 8.22386 4 8.5 4H11.5C11.7761 4 12 4.22386 12 4.5V6M14.5 6L14 15.5C14 16.0523 13.5523 16.5 13 16.5H7C6.44772 16.5 6 16.0523 6 15.5L5.5 6M8.25 9V13.5M11.75 9V13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
