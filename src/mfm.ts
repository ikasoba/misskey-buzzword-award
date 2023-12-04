export const center = (child: string): string => `<center>${child}</center>`;

export const tada = (child: string, speed?: number): string =>
  `$[tada${speed ? `.speed=${speed}s` : ""} ${child}]`;

export const shake = (child: string, speed?: number): string =>
  `$[shake${speed ? `.speed=${speed}s` : ""} ${child}]`;

export const twitch = (child: string, speed?: number): string =>
  `$[twitch${speed ? `.speed=${speed}s` : ""} ${child}]`;

export const sparkle = (child: string): string => `$[sparkle ${child}]`;

export const font = (child: string, name: string): string =>
  `$[font.${name} ${child}]`;

export const x2 = (child: string): string => `$[x2 ${child}]`;
export const x3 = (child: string): string => `$[x3 ${child}]`;
export const x4 = (child: string): string => `$[x4 ${child}]`;
