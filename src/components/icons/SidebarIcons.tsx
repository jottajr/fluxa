function IconBase({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {children}
    </svg>
  );
}

const strokeProps = {
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="3" width="6" height="6" rx="1" {...strokeProps} />
      <rect x="11" y="3" width="6" height="6" rx="1" {...strokeProps} />
      <rect x="3" y="11" width="6" height="6" rx="1" {...strokeProps} />
      <rect x="11" y="11" width="6" height="6" rx="1" {...strokeProps} />
    </IconBase>
  );
}

export function TransacoesIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M3 6.5H15M12 3L15 6.5L12 10" {...strokeProps} />
      <path d="M17 13.5H5M8 10L5 13.5L8 17" {...strokeProps} />
    </IconBase>
  );
}

export function PagamentosIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="2.5" y="5" width="15" height="10" rx="2" {...strokeProps} />
      <path d="M2.5 8.5H17.5" {...strokeProps} />
    </IconBase>
  );
}

export function CategoriasIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path
        d="M3 5.5A1.5 1.5 0 0 1 4.5 4H8l2 2.5H16A1.5 1.5 0 0 1 17.5 8v6.5A1.5 1.5 0 0 1 16 16H4.5A1.5 1.5 0 0 1 3 14.5V5.5Z"
        {...strokeProps}
      />
    </IconBase>
  );
}

export function InvestimentosIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M3 14L8 9L11.5 12.5L17 6" {...strokeProps} />
      <path d="M12.5 6H17V10.5" {...strokeProps} />
    </IconBase>
  );
}

export function MetasIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="10" cy="10" r="7" {...strokeProps} />
      <circle cx="10" cy="10" r="3.3" {...strokeProps} />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function ConfiguracoesIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 5.5H12" {...strokeProps} />
      <path d="M4 10H9" {...strokeProps} />
      <path d="M4 14.5H13" {...strokeProps} />
      <circle cx="14.5" cy="5.5" r="1.5" {...strokeProps} />
      <circle cx="11.5" cy="10" r="1.5" {...strokeProps} />
      <circle cx="15.5" cy="14.5" r="1.5" {...strokeProps} />
    </IconBase>
  );
}

export function SobreIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="10" cy="10" r="7.2" {...strokeProps} />
      <path d="M10 9.3V14" {...strokeProps} />
      <circle cx="10" cy="6.3" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
