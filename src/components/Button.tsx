import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost-light' | 'ghost-dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ActionButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
    href?: undefined;
  };

type RouterLinkButtonProps = BaseProps & {
  to: string;
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type ExternalLinkButtonProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    to?: undefined;
  };

export type ButtonProps = ActionButtonProps | RouterLinkButtonProps | ExternalLinkButtonProps;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FFD84A] text-[#092F35] hover:bg-[#ffe170] focus-visible:ring-[#FFD84A] font-semibold',
  secondary:
    'bg-[#0F8A5F] text-white hover:bg-[#0B5D4B] focus-visible:ring-[#0F8A5F] font-semibold',
  dark:
    'bg-[#092F35] text-[#F7F4EC] hover:bg-[#0F4C5C] focus-visible:ring-[#092F35] font-semibold',
  'ghost-light':
    'border border-white/25 text-[#F7F4EC] hover:bg-white/10 focus-visible:ring-white/50 font-medium',
  'ghost-dark':
    'border border-[#092F35]/20 text-[#092F35] hover:bg-[#092F35]/5 focus-visible:ring-[#092F35]/40 font-medium',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3.5 text-sm md:text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const baseClasses = `inline-flex items-center justify-center gap-2 rounded-lg transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkProps } = rest;
    return (
      <Link to={to} className={baseClasses} {...linkProps}>
        {children}
      </Link>
    );
  }

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchorProps } = rest;
    return (
      <a href={href} className={baseClasses} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={baseClasses} {...buttonProps}>
      {children}
    </button>
  );
};
