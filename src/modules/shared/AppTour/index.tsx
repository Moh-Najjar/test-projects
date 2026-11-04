import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Joyride, ACTIONS, EVENTS, STATUS } from 'react-joyride';
import type { EventData, Controls, PartialDeep, Styles } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import { useTour } from '../../../core/context/TourContext';
import { getTourSteps } from './tourSteps';

// ─── Locale button labels ─────────────────────────────────────────────────────

const LOCALE_AR = {
  back: 'السابق',
  close: 'إغلاق',
  last: 'إنهاء الجولة',
  next: 'التالي',
  open: 'فتح',
  skip: 'تخطي الجولة',
};

const LOCALE_EN = {
  back: 'Back',
  close: 'Close',
  last: 'Finish Tour',
  next: 'Next',
  open: 'Open',
  skip: 'Skip Tour',
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AppTour renders the Joyride overlay using controlled mode.
 * It handles cross-page navigation automatically:
 * when a step belongs to a different route, it navigates there before
 * advancing the step index so the target element is in the DOM.
 *
 * Tour content and button labels switch with the app language (AR / EN).
 * Must be rendered inside <BrowserRouter> and <TourProvider>.
 */
const AppTour: React.FC = () => {
  const { isRunning, stepIndex, setStepIndex, stopTour } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { i18n } = useTranslation();

  const isAr = i18n.language === 'ar';

  // Re-compute steps whenever the language changes.
  const steps = useMemo(() => getTourSteps(isAr), [isAr]);

  // Track pending navigation to avoid double-advancing the step index.
  const pendingStepIndex = useRef<number | null>(null);

  // After a route change, if we have a pending step, advance to it.
  useEffect(() => {
    if (pendingStepIndex.current !== null) {
      const next = pendingStepIndex.current;
      pendingStepIndex.current = null;
      // Small delay so the page DOM has time to mount before Joyride queries the target.
      const timer = window.setTimeout(() => {
        setStepIndex(next);
      }, 600);
      return () => {
        window.clearTimeout(timer);
      };
    }
    return undefined;
  }, [location.pathname, setStepIndex]);

  const handleEvent = useCallback(
    (data: EventData, _controls: Controls): void => {
      const { action, index, status, type } = data;

      // Tour completed or skipped — reset.
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        stopTour();
        return;
      }

      // Handle step transitions (forward or backward).
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        const direction = action === ACTIONS.PREV ? -1 : 1;
        const nextIndex = index + direction;

        if (nextIndex < 0 || nextIndex >= steps.length) {
          stopTour();
          return;
        }

        const nextStep = steps[nextIndex];
        const needsNavigation =
          typeof nextStep !== 'undefined' &&
          location.pathname !== nextStep.routePath;

        if (needsNavigation) {
          // Navigate first; the useEffect above will set the step index after mount.
          pendingStepIndex.current = nextIndex;
          navigate(nextStep.routePath);
        } else {
          setStepIndex(nextIndex);
        }
      }
    },
    [location.pathname, navigate, setStepIndex, stopTour, steps]
  );

  // Tooltip direction flips with the app language.
  const tooltipDirection = isAr ? 'rtl' : 'ltr';
  const tooltipTextAlign = isAr ? 'right' : 'left';

  // Build Joyride styles matching ASEZA's theme and current language direction.
  const joyrideStyles: PartialDeep<Styles> = {
    tooltip: {
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      fontFamily: 'inherit',
      direction: tooltipDirection,
      textAlign: tooltipTextAlign,
      maxWidth: '360px',
    },
    tooltipTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: theme.palette.primary.main,
      marginBottom: '8px',
    },
    tooltipContent: {
      fontSize: '14px',
      lineHeight: '1.7',
      padding: '8px 0',
    },
    buttonPrimary: {
      backgroundColor: theme.palette.primary.main,
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      padding: '8px 20px',
    },
    buttonBack: {
      color: theme.palette.primary.main,
      fontSize: '14px',
      fontWeight: 600,
      marginRight: isAr ? '0px' : '8px',
      marginLeft: isAr ? '8px' : '0px',
    },
    buttonSkip: {
      color: theme.palette.text.secondary,
      fontSize: '13px',
    },
    beaconInner: {
      backgroundColor: theme.palette.primary.main,
    },
    beaconOuter: {
      backgroundColor: theme.palette.primary.light,
      border: `2px solid ${theme.palette.primary.main}`,
    },
  };

  return (
    <Joyride
      steps={steps}
      stepIndex={stepIndex}
      run={isRunning}
      continuous
      scrollToFirstStep
      locale={isAr ? LOCALE_AR : LOCALE_EN}
      styles={joyrideStyles}
      onEvent={handleEvent}
      options={{
        overlayColor: 'rgba(0, 0, 0, 0.55)',
        primaryColor: theme.palette.primary.main,
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
    />
  );
};

export default AppTour;
