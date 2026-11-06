import type { HTMLAttributes } from "react";
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div data-slot="card" className={`qm-card ${className}`} {...props} />; }
