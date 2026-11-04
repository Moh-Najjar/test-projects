import React from 'react';

import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

// Keep ErrorBoundary props strictly typed (no `any`).
interface ErrorBoundaryProps extends React.PropsWithChildren {
  // Translation function injected via a small wrapper (class components can't use hooks).
  t: TFunction<'common'>;
}

// Keep the ErrorBoundary state strongly typed and explicit.
interface ErrorBoundaryState {
  // Whether we are currently showing the fallback UI.
  hasError: boolean;
  // The error captured from a child component (if any).
  error: Error | null;
  // A lightweight unique-ish identifier to help correlate user reports with logs.
  errorId: string | null;
  // Whether to render extra technical details in the UI.
  showDetails: boolean;
}

/**
 * Create a best-effort error id that is stable for the current crash screen.
 * We avoid external dependencies and keep it browser-safe with guarded access.
 */
const createErrorId = (): string => {
  // Prefer cryptographically strong UUIDs when available.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random (not cryptographically strong, but good enough for correlation).
  const now = Date.now();
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${now}-${rand}`;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initialize with a clean "no error" state.
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error, errorId: createErrorId() };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log full details for debugging/monitoring tools.
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
    });
  }

  private handleTryAgain = (): void => {
    // Reset state to attempt rendering children again.
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      showDetails: false,
    });
  };

  private handleGoHome = (): void => {
    // Use a hard navigation so it works even if routing is unavailable in the fallback state.
    if (typeof window === 'undefined') {
      return;
    }

    window.location.assign('/');
  };

  private handleReload = (): void => {
    // Guard for environments where `window` is not available (e.g., SSR).
    if (typeof window === 'undefined') {
      return;
    }

    window.location.reload();
  };

  private handleToggleDetails = (): void => {
    // Toggle technical details visibility.
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Localized UI strings.
      const title = this.props.t('errorBoundary.title');
      const subtitle = this.props.t('errorBoundary.subtitle');

      return (
        <Box
          // Full-viewport background container.
          sx={{
            display: 'flex',
            position: 'fixed',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            backgroundColor: 'background.default',
          }}>
          <Container maxWidth="sm">
            <Paper
              elevation={1}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
              }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ReportProblemOutlinedIcon color="error" />
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {title}
                  </Typography>
                </Stack>

                <Typography variant="body1" color="text.secondary">
                  {subtitle}
                </Typography>

                {this.state.errorId ? (
                  <Typography variant="body2" color="text.secondary">
                    {this.props.t('errorBoundary.errorIdLabel', {
                      id: this.state.errorId,
                    })}
                  </Typography>
                ) : null}

                <Divider />

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    justifyContent: 'center',
                  }}>
                  <Button variant="contained" color="primary" onClick={this.handleGoHome}>
                    {this.props.t('errorBoundary.goHome')}
                  </Button>
                  <Button variant="outlined" onClick={this.handleReload}>
                    {this.props.t('errorBoundary.reloadPage')}
                  </Button>
                </Box>

                <Button
                  variant="text"
                  color="inherit"
                  onClick={this.handleToggleDetails}
                  sx={{ justifyContent: 'flex-start' }}>
                  {this.state.showDetails
                    ? this.props.t('errorBoundary.hideDetails')
                    : this.props.t('errorBoundary.showDetails')}
                </Button>

                {this.state.showDetails ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor: 'background.paper',
                      borderColor: 'divider',
                      overflow: 'auto',
                      maxHeight: 240,
                    }}>
                    <Typography
                      component="pre"
                      sx={{
                        m: 0,
                        fontFamily:
                          '"ui-monospace", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'text.primary',
                      }}>
                      {this.state.error
                        ? [
                            this.props.t('errorBoundary.details.message', {
                              message: this.state.error.message,
                            }),
                            this.state.error.stack
                              ? [
                                  '\n\n',
                                  this.props.t('errorBoundary.details.stackHeader'),
                                  '\n',
                                  this.state.error.stack,
                                ].join('')
                              : '',
                          ].join('')
                        : this.props.t('errorBoundary.noDetails')}
                    </Typography>
                  </Paper>
                ) : null}
              </Stack>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Default export: translation-aware wrapper so the app can keep using
 * `<ErrorBoundary>...</ErrorBoundary>` without changing call sites.
 */
const ErrorBoundaryWithI18n: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  return <ErrorBoundary t={t}>{children}</ErrorBoundary>;
};

export default ErrorBoundaryWithI18n;
