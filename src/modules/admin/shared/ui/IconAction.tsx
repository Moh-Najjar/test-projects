import React from 'react';
import { IconButton, Tooltip, alpha, useTheme } from '@mui/material';
import { ADMIN_ACCENT } from '../theme/adminTokens';

/** Visual intent of a row action. */
export type IconActionTone = 'primary' | 'accent' | 'danger';

interface IconActionProps {
  /** Tooltip text and accessible label. */
  label: string;
  onClick: () => void;
  tone?: IconActionTone;
  disabled?: boolean;
  children: React.ReactNode;
}

/** Tinted square icon button that fills with its tone colour on hover. */
const IconAction: React.FC<IconActionProps> = ({ label, onClick, tone = 'primary', disabled = false, children }) => {
  const theme = useTheme();

  // Map the semantic tone onto a concrete colour.
  const color =
    tone === 'danger' ? theme.palette.error.main : tone === 'accent' ? ADMIN_ACCENT : theme.palette.primary.main;

  return (
    <Tooltip title={label}>
      {/* Span keeps the tooltip working while the button is disabled. */}
      <span>
        <IconButton
          size="small"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          sx={{
            width: 34,
            height: 34,
            color,
            bgcolor: alpha(color, 0.1),
            '& svg': { fontSize: 18 },
            '&:hover': {
              bgcolor: color,
              color: '#FFFFFF',
              transform: 'translateY(-1px)',
              boxShadow: `0 8px 16px -8px ${alpha(color, 0.9)}`,
            },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default IconAction;
