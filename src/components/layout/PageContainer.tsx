import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export default function PageContainer({ children, className = "", as: Component = "div" }: PageContainerProps) {
  return (
    <Component className={`w-full max-w-[1280px] mx-auto px-4 md:px-8 ${className}`}>
      {children}
    </Component>
  );
}
