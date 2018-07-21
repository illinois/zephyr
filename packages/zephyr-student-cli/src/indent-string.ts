export const indentWithString = (indent: string) => {
  return (str: string): string => {
    return str.trim().split('\n').map((s) => indent + s).join('\n');
  };
};

export const indentWithPad = (indent: number) => {
  const pad = ' '.repeat(indent);
  return indentWithString(pad);
};
