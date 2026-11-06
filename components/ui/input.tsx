import type { InputHTMLAttributes } from "react";
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input data-slot="input" className={`qm-input ${className}`} {...props} />; }
