import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';

/**
 * NoData Component
 *
 * A shared component to display a "No Data" or "Empty State" message with an optional icon.
 */
interface NoDataProps {
  /** The message to display */
  message: string;
  /** Optional icon to display. Defaults to InfoOutlinedIcon */
  icon?: React.ReactElement<SvgIconProps>;
}

const NoData: React.FC<NoDataProps> = ({ message, icon }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
        borderRadius: '16px',
        width: '100%',
      }}>
      {icon ? (
        React.cloneElement(icon, {
          sx: { fontSize: '50px', color: 'primary.main', mb: 2, opacity: 0.5, ...icon.props.sx },
        })
      ) : (
        <InfoOutlinedIcon sx={{ fontSize: '50px', color: 'primary.main', mb: 2, opacity: 0.5 }} />
      )}
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default NoData;
