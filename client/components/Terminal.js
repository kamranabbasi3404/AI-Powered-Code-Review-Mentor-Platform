'use client';
import { forwardRef } from 'react';
import dynamic from 'next/dynamic';

const TerminalBase = dynamic(() => import('./TerminalBase'), { ssr: false });

const Terminal = forwardRef((props, ref) => {
  return <TerminalBase {...props} forwardedRef={ref} />;
});

Terminal.displayName = 'Terminal';
export default Terminal;
