"use client";

import type { ChangeEvent, HTMLInputTypeAttribute, TextareaHTMLAttributes } from "react";

interface FormFieldProps {
  label: string;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  mono?: boolean;
  type?: HTMLInputTypeAttribute;
  onChange?: (value: string) => void;
}

export function FormField({ label, value, required, readOnly, mono, type = "text", onChange }: FormFieldProps) {
  const cls = `field${required ? " field--required" : ""}`;
  const inputCls = `field__input${mono ? " is-mono" : ""}`;
  return (
    <div className={cls}>
      <label className="field__label">{label}</label>
      <input
        className={inputCls}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
      />
    </div>
  );
}

interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
}

export function TextareaField({ label, value, onChange, ...rest }: TextareaFieldProps) {
  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}
      <textarea
        className="field__input"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...rest}
      />
    </div>
  );
}
