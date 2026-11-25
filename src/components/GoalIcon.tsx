import React from 'react';
import type { GoalCheckItem } from '../engine/types';

interface GoalIconProps {
  icon: GoalCheckItem['icon'];
  satisfied: boolean;
  size?: number;
}

export const GoalIcon: React.FC<GoalIconProps> = ({ icon, satisfied, size = 18 }) => {
  switch (icon) {
    case 'led_red':
    case 'led_green':
    case 'led_amber':
    case 'led_blue': {
      const fillMap = {
        led_red: satisfied ? '#F24C3D' : '#B97872',
        led_green: satisfied ? '#27B866' : '#7BA68E',
        led_amber: satisfied ? '#F0A824' : '#B59B69',
        led_blue: satisfied ? '#3399FF' : '#7B9AB8',
      };
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          {satisfied && <circle cx="12" cy="11" r="9.5" fill={fillMap[icon]} opacity="0.24" />}
          <path d="M7 14a5 5 0 1 1 10 0v2H7v-2Z" fill={fillMap[icon]} stroke="#1E262D" strokeWidth="1.5" />
          <line x1="9.5" y1="16" x2="9.5" y2="21" stroke="#58636E" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="14.5" y1="16" x2="14.5" y2="20" stroke="#58636E" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    }
    case 'motor':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill={satisfied ? '#D8F4EF' : '#E7E4DC'} stroke="#1E262D" strokeWidth="1.5" />
          <path
            d="M12 12 C12 7, 16 7, 16 10 C16 12, 14 12, 12 12 Z M12 12 C17 12, 17 16, 14 16 C12 16, 12 14, 12 12 Z M12 12 C12 17, 8 17, 8 14 C8 12, 10 12, 12 12 Z M12 12 C7 12, 7 8, 10 8 C12 8, 12 10, 12 12 Z"
            fill={satisfied ? '#1C8A7C' : '#7B8793'}
          />
          <circle cx="12" cy="12" r="2" fill="#E1B854" />
        </svg>
      );
    case 'buzzer':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10" cy="12" r="6" fill="#2A3138" />
          <circle cx="10" cy="12" r="2.2" fill={satisfied ? '#F2B830' : '#9AA3AC'} />
          <path d="M18 8.5a5 5 0 0 1 0 7" fill="none" stroke={satisfied ? '#DF9A1A' : '#9AA3AC'} strokeWidth="2" strokeLinecap="round" />
          <path d="M20.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke={satisfied ? '#DF9A1A' : '#B9C0C7'} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'switch':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="7" width="18" height="10" rx="5" fill={satisfied ? '#228B54' : '#9AA3AC'} />
          <circle cx={satisfied ? 16 : 8} cy="12" r="3.5" fill="#FFFFFF" />
        </svg>
      );
    case 'meter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="3.5" fill={satisfied ? '#EAB22C' : '#C8C2B6'} stroke="#1E262D" strokeWidth="1.4" />
          <rect x="7" y="6" width="10" height="5" rx="1" fill="#C6D6B4" />
          <circle cx="12" cy="15.5" r="2.5" fill="#2A3138" />
        </svg>
      );
    case 'sun':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.8" fill={satisfied ? '#F2A922' : '#9AA3AC'} />
          <g stroke={satisfied ? '#E59618' : '#9AA3AC'} strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="2.5" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="21.5" />
            <line x1="2.5" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="21.5" y2="12" />
            <line x1="5.3" y1="5.3" x2="7.1" y2="7.1" />
            <line x1="16.9" y1="16.9" x2="18.7" y2="18.7" />
            <line x1="18.7" y1="5.3" x2="16.9" y2="7.1" />
            <line x1="7.1" y1="16.9" x2="5.3" y2="18.7" />
          </g>
        </svg>
      );
    case 'fire':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12.5 2.5c.8 4.2-3.5 5.8-3.5 10a4.5 4.5 0 0 0 9 0c0-3.2-2.2-5.4-3-7-.3 1.7-1.4 2.5-2.2 2.5 1.1-2 .9-3.9-.3-5.5Z"
            fill={satisfied ? '#E8532F' : '#9AA3AC'}
          />
          <circle cx="13" cy="14" r="2.2" fill={satisfied ? '#FFD159' : '#D5D9DD'} />
        </svg>
      );
    case 'chip':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2.5" fill={satisfied ? '#2D3A46' : '#8B96A1'} />
          <circle cx="12" cy="12" r="2.5" fill={satisfied ? '#44D787' : '#CFD5DC'} />
          <g stroke="#56626D" strokeWidth="1.8" strokeLinecap="round">
            <line x1="9" y1="2.5" x2="9" y2="6" />
            <line x1="15" y1="2.5" x2="15" y2="6" />
            <line x1="9" y1="18" x2="9" y2="21.5" />
            <line x1="15" y1="18" x2="15" y2="21.5" />
          </g>
        </svg>
      );
    case 'wave':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M2.5 12 C 5.5 4, 8.5 4, 12 12 C 15.5 20, 18.5 20, 21.5 12"
            fill="none"
            stroke={satisfied ? '#1C8A7C' : '#8B96A1'}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'bolt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"
            fill={satisfied ? '#E5A31D' : '#9AA3AC'}
          />
        </svg>
      );
    case 'shield':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3Z"
            fill={satisfied ? '#228B54' : '#9AA3AC'}
          />
          <path d="M9 12.2l2 2 4.2-4.4" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};
