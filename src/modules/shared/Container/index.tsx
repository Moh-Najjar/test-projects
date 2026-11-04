import React from 'react';
import { useDeviceType } from '../../../core/hooks/useDeviceType';
import { useAuth } from '../../../core/context/AuthContext';

export interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
}

const Container: React.FC<ContainerProps> = ({ children, maxWidth = '100%' }) => {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const { isAuthenticated } = useAuth();

  maxWidth = isAuthenticated ? '80%' : '100%';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : maxWidth,
        margin: '0 auto',
        // Fixed side inset so content does not sit on the screen edge.
        padding: isMobile ? '0 12px' : '0',
      }}>
      {children}
    </div>
  );
};

export default Container;
