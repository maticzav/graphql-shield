import { useCopyToClipboard } from 'react-use';
import { MdContentCopy } from 'react-icons/md';
import { IconButton, useToast } from '@chakra-ui/react';
import { memo, useState } from 'react';
import { TiTickOutline } from 'react-icons/ti';

export const CopyToClipboard = memo(({ value }: { value: string }) => {
  const [, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState<string | undefined>();
  const toast = useToast();

  return (
    <IconButton
      aria-label="Copy to clipboard"
      position="absolute"
      top="0"
      right="0"
      icon={copied ? <TiTickOutline /> : <MdContentCopy />}
      title="Copy to clipboard"
      onClick={() => {
        copy(value);

        setCopied(value);
        toast({
          status: 'info',
          title: `Copied to clipboard!`,
          position: 'bottom',
          duration: 1000,
        });

        setTimeout(() => {
          setCopied(undefined);
        }, 1000);
      }}
    />
  );
});
