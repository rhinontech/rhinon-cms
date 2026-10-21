import React from 'react';

type Props = {
  isActive: boolean;
};

const homeIcon = () => {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 10.1422L10.454 1.18716C10.894 0.74816 11.606 0.74816 12.045 1.18716L21 10.1422M3.75 7.89216V18.0172C3.75 18.6382 4.254 19.1422 4.875 19.1422H9V14.2672C9 13.6462 9.504 13.1422 10.125 13.1422H12.375C12.996 13.1422 13.5 13.6462 13.5 14.2672V19.1422H17.625C18.246 19.1422 18.75 18.6382 18.75 18.0172V7.89216M7.5 19.1422H15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const chatIcon = () => {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 6.25H15.5M6.5 9.25H11M1.25 10.76C1.25 12.36 2.373 13.754 3.957 13.987C5.086 14.153 6.227 14.28 7.38 14.366C7.73 14.392 8.05 14.576 8.245 14.867L11 19L13.755 14.867C13.8516 14.7233 13.9798 14.6034 14.1297 14.5166C14.2795 14.4298 14.4472 14.3783 14.62 14.366C15.7652 14.2805 16.9069 14.1541 18.043 13.987C19.627 13.754 20.75 12.361 20.75 10.759V4.741C20.75 3.139 19.627 1.746 18.043 1.513C15.711 1.17072 13.357 0.99926 11 1C8.608 1 6.256 1.175 3.957 1.513C2.373 1.746 1.25 3.14 1.25 4.741V10.759V10.76Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const helpIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.879 5.519C9.05 4.494 10.95 4.494 12.121 5.519C13.293 6.544 13.293 8.206 12.121 9.231C11.918 9.41 11.691 9.557 11.451 9.673C10.706 10.034 10.001 10.672 10.001 11.5V12.25M19 10C19 11.1819 18.7672 12.3522 18.3149 13.4442C17.8626 14.5361 17.1997 15.5282 16.364 16.364C15.5282 17.1997 14.5361 17.8626 13.4442 18.3149C12.3522 18.7672 11.1819 19 10 19C8.8181 19 7.64778 18.7672 6.55585 18.3149C5.46392 17.8626 4.47177 17.1997 3.63604 16.364C2.80031 15.5282 2.13738 14.5361 1.68508 13.4442C1.23279 12.3522 1 11.1819 1 10C1 7.61305 1.94821 5.32387 3.63604 3.63604C5.32387 1.94821 7.61305 1 10 1C12.3869 1 14.6761 1.94821 16.364 3.63604C18.0518 5.32387 19 7.61305 19 10ZM10 15.25H10.008V15.258H10V15.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ticketsColorIcon = () => {
  return (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
    >
      <rect width='24' height='24' fill='url(#pattern0_80_153)' />
      <defs>
        <pattern
          id='pattern0_80_153'
          patternContentUnits='objectBoundingBox'
          width='1'
          height='1'
        >
          <use xlinkHref='#image0_80_153' transform='scale(0.01)' />
        </pattern>
        <image
          id='image0_80_153'
          width='100'
          height='100'
          preserveAspectRatio='none'
          xlinkHref='data:image/png;base64,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'
        />
      </defs>
    </svg>
  );
};
const newsIcon = () => {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4.5H11.5M10 7.5H11.5M4 10.5H11.5M4 13.5H11.5M14.5 4.5H17.875C18.496 4.5 19 5.004 19 5.625V15C19 15.5967 18.7629 16.169 18.341 16.591C17.919 17.0129 17.3467 17.25 16.75 17.25M14.5 4.5V15C14.5 15.5967 14.7371 16.169 15.159 16.591C15.581 17.0129 16.1533 17.25 16.75 17.25M14.5 4.5V1.875C14.5 1.254 13.996 0.75 13.375 0.75H2.125C1.504 0.75 1 1.254 1 1.875V15C1 15.5967 1.23705 16.169 1.65901 16.591C2.08097 17.0129 2.65326 17.25 3.25 17.25H16.75M4 4.5H7V7.5H4V4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>

  )
}

const supportHistoryIcon = () => {
  return (
    <svg
      width='25'
      height='24'
      viewBox='0 0 25 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
    >
      <rect x='0.5' width='24' height='24' fill='url(#pattern0_80_160)' />
      <defs>
        <pattern
          id='pattern0_80_160'
          patternContentUnits='objectBoundingBox'
          width='1'
          height='1'
        >
          <use xlinkHref='#image0_80_160' transform='scale(0.01)' />
        </pattern>
        <image
          id='image0_80_160'
          width='100'
          height='100'
          preserveAspectRatio='none'
          xlinkHref='data:image/png;base64,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'
        />
      </defs>
    </svg>
  );
};

const ArticleSaveIcon: React.FC<Props> = ({ isActive }) => {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 13 15'
      fill={isActive ? '#3E68FC' : 'none'}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M5.69586 11.9524L3.09379 13.7426C2.90821 13.8771 2.68657 13.9623 2.45266 13.9889C2.21876 14.0156 1.98143 13.9827 1.76617 13.8939C1.55091 13.805 1.36585 13.6636 1.23086 13.4846C1.09588 13.3057 1.01606 13.0961 1 12.8784V3.529C1.0135 3.1845 1.10016 2.84583 1.25503 2.53236C1.40989 2.21888 1.62993 1.93674 1.90257 1.70205C2.17521 1.46736 2.49511 1.28471 2.84399 1.16456C3.19287 1.0444 3.56389 0.989091 3.93586 1.00178H9.06414C9.8151 0.977095 10.546 1.22932 11.0964 1.70311C11.6468 2.1769 11.9717 2.83356 12 3.529V12.8798C11.9843 13.0977 11.9047 13.3075 11.7698 13.4867C11.6348 13.6658 11.4497 13.8074 11.2342 13.8962C11.0188 13.9851 10.7813 14.0178 10.5472 13.9908C10.3132 13.9639 10.0916 13.8783 9.90621 13.7433L7.30414 11.9531C7.07056 11.7955 6.78901 11.7105 6.5 11.7105C6.21099 11.7105 5.92944 11.7947 5.69586 11.9524Z'
        stroke={isActive ? '#3E68FC' : '#BEBEBE'}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

const svgIcons = {
  homeIcon,
  chatIcon,
  helpIcon,
  ticketsColorIcon,
  supportHistoryIcon,
  newsIcon,
  ArticleSaveIcon,
};

export default svgIcons;
