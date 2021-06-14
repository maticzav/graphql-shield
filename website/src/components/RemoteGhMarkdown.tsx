import React from 'react';
import ReactMarkdown, { uriTransformer } from 'react-markdown';
import { components } from '@guild-docs/client';

export const RemoteGHMarkdown: React.FC<{ children: string; repo?: string; directory?: string }> = ({
  children,
  repo,
  directory,
}) => {
  return (
    <ReactMarkdown
      components={components}
      linkTarget="_blank"
      transformImageUri={src => {
        const initial = uriTransformer(src);

        if (repo) {
          let modified = repo.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/HEAD/';

          if (directory) {
            modified = modified + directory;
          }

          return modified + (initial.startsWith('.') ? initial.substr(1) : initial);
        }

        return initial;
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
