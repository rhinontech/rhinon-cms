// src/index.d.ts

declare module '*.css';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module 'js-cookie';
declare module '*.mp3';

declare module '*.png' {
  const value: string;
  export default value;
}
