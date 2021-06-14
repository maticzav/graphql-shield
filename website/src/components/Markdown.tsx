import React from 'react';
import ReactMarkdown, { uriTransformer } from 'react-markdown';
import { components } from '@guild-docs/client';

export const Markdown: React.FC<{ children: string }> = ({ children }) => {
  return (
    <ReactMarkdown linkTarget="_blank" components={components}>
      {children}
    </ReactMarkdown>
  );
};
