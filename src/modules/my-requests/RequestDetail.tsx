import React from "react";

import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useGetSubmissionDetails } from "../../core/hooks/useFormApi";
import Breadcrumbs from "../shared/Breadcrumbs";
import HeroBanner from "../shared/HeroBanner";
import RequestDetailStepper from "./components/RequestDetailStepper";
import { getStatusChipProps, mapApiStatus } from "./utils/statusHelpers";
import { useDeviceType } from "../../core/hooks/useDeviceType";

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

interface SidebarRowProps {
  icon: React.ReactElement;
  label: string;
  value: React.ReactNode;
}

/** A compact labeled row used inside the sidebar cards */
const SidebarRow: React.FC<SidebarRowProps> = ({ icon, label, value }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          mt: 0.2,
          color: theme.palette.primary.main,
          opacity: 0.7,
          flexShrink: 0,
          "& svg": { fontSize: 16 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            display: "block",
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", fontWeight: 500, mt: 0.2, wordBreak: "break-word" }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
};

/** Skeleton placeholder for sidebar cards while data is loading */
const SidebarSkeleton: React.FC = () => (
  <Stack spacing={2}>
    {[1, 2, 3, 4].map((i) => (
      <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
        <Skeleton variant="circular" width={18} height={18} sx={{ mt: 0.3, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" height={12} />
          <Skeleton variant="text" width="65%" height={16} sx={{ mt: 0.3 }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

// ─── Main page ────────────────────────────────────────────────────────────────

/**
 * RequestDetail — full-page view of a single KPI submission.
 *
 * Reads the :submissionId URL parameter, fetches the full submission detail,
 * and renders a read-only stepper alongside a metadata sidebar.
 */
const RequestDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isAr = i18n.language === "ar";

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  const { submissionId: submissionIdParam } = useParams<{ submissionId: string }>();

  // Parse the URL param to a number; treat missing/invalid as undefined
  const submissionId: number | undefined =
    submissionIdParam !== undefined && submissionIdParam.trim() !== ""
      ? parseInt(submissionIdParam, 10)
      : undefined;

  const isParamValid = submissionId !== undefined && !isNaN(submissionId);

  const { data: detail, isLoading, isError } = useGetSubmissionDetails(
    isParamValid ? submissionId : undefined
  );

  // ── Derived display values ────────────────────────────────────────────────

  const status = detail !== undefined ? mapApiStatus(detail.submissionStatus) : "DRAFT";

  const formName =
    detail !== undefined
      ? isAr
        ? detail.formNameAr
        : detail.formNameEn
      : "";

  const directorate =
    detail !== undefined
      ? isAr
        ? detail.directorateNameAr
        : detail.directorateNameEn
      : "";

  const periodLabel =
    detail !== undefined
      ? new Date(detail.reportingDate).toLocaleDateString(isAr ? "ar" : "en", {
          month: "long",
          year: "numeric",
        })
      : "—";

  const formatDate = (iso: string | null): string => {
    if (iso === null) return "—";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(isAr ? "ar" : "en", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Stepper step tracking for the progress card ───────────────────────────
  const [stepProgress, setStepProgress] = React.useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });

  const handleStepChange = React.useCallback((current: number, total: number): void => {
    setStepProgress({ current, total });
  }, []);

  const progressValue = ((stepProgress.current + 1) / Math.max(stepProgress.total, 1)) * 100;

  // ── Navigation callbacks ──────────────────────────────────────────────────

  const handleClose = (): void => {
    navigate("/my-requests");
  };

  const handleEdit = (editSubmissionId: number): void => {
    navigate(`/my-requests/${editSubmissionId}/edit`);
  };

  // ── Invalid param guard ───────────────────────────────────────────────────

  if (!isParamValid) {
    return (
      <Box component="main" sx={{ pb: 8 }}>
        <Container maxWidth="xl">
          <Breadcrumbs />
          <Alert severity="error" sx={{ mt: 3 }}>
            {t("common.errorLoading")}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="xl">
        {/* ── Navigation context ── */}
        <Breadcrumbs />

        {/* ── Hero Banner ── */}
        <HeroBanner
          title={t("requestDetail.pageTitle")}
          subtitle={t("requestDetail.pageSubtitle")}
          badgeLabel={t("requestDetail.badgeLabel")}
          BadgeIcon={AssignmentTurnedInIcon}
        />

        {/* ── API error ── */}
        {isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t("common.errorLoading")}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 4,
          }}
        >
          {/* ── Main: read-only stepper ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: "12px", md: 4 },
                borderRadius: "24px",
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: "background.paper",
                boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.03)}`,
              }}
            >
              <RequestDetailStepper
                detail={detail}
                isLoading={isLoading}
                isError={isError}
                onClose={handleClose}
                onEdit={handleEdit}
                onStepChange={handleStepChange}
              />
            </Paper>
          </Box>

          {/* ── Sidebar ── */}
          <Box
            sx={{
              width: { xs: "100%", lg: "350px" },
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? "12px" : 3,
            }}
          >
            {/* Step progress card */}
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? "16px" : 3,
                borderRadius: "20px",
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: "background.paper",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SpeedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {t("requestDetail.sidebar.progressTitle")}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {`${Math.round(progressValue)}%`}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  "& .MuiLinearProgress-bar": { borderRadius: 5 },
                }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                {t("newRequest.progress.stepInfo", {
                  current: stepProgress.current + 1,
                  total: stepProgress.total,
                })}
              </Typography>
            </Paper>

            {/* Submission metadata card */}
            <Paper
              elevation={0}
              sx={{
                p: isMobile ? "16px" : 3,
                borderRadius: "20px",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <AssignmentIcon color="action" />
                <Typography variant="subtitle1" fontWeight="bold">
                  {t("requestDetail.sidebar.submissionInfo")}
                </Typography>
              </Box>

              {isLoading ? (
                <SidebarSkeleton />
              ) : (
                <Stack spacing={isMobile ? "12px" : 2}>
                  {/* Status chip */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.disabled",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      {t("myRequests.status.status")}
                    </Typography>
                    <Chip
                      {...getStatusChipProps(status, t)}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                  </Box>

                  <Divider />

                  <SidebarRow
                    icon={<AssignmentIcon />}
                    label={t("requestDetail.sidebar.referenceNumber")}
                    value={
                      <Typography
                        component="span"
                        sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.875rem" }}
                      >
                        {detail?.referenceNumber ?? "—"}
                      </Typography>
                    }
                  />

                  <SidebarRow
                    icon={<AssignmentIcon />}
                    label={t("myRequests.table.form")}
                    value={formName}
                  />

                  <SidebarRow
                    icon={<AssignmentIcon />}
                    label={t("myRequests.table.directorate")}
                    value={directorate}
                  />

                  <SidebarRow
                    icon={<CalendarTodayOutlinedIcon />}
                    label={t("requestDetail.sidebar.period")}
                    value={periodLabel}
                  />

                  <SidebarRow
                    icon={<PersonOutlineIcon />}
                    label={t("requestDetail.sidebar.submittedBy")}
                    value={detail?.enteredByUserName ?? "—"}
                  />

                  <SidebarRow
                    icon={<CalendarTodayOutlinedIcon />}
                    label={t("requestDetail.sidebar.submittedAt")}
                    value={formatDate(detail?.createdAt ?? null)}
                  />

                  {/* Show approval info only when the submission has been approved */}
                  {detail?.approvedByUserName !== null &&
                    detail?.approvedByUserName !== undefined && (
                      <>
                        <Divider />
                        <SidebarRow
                          icon={<PersonOutlineIcon />}
                          label={t("requestDetail.sidebar.approvedBy")}
                          value={detail.approvedByUserName}
                        />
                        <SidebarRow
                          icon={<CalendarTodayOutlinedIcon />}
                          label={t("requestDetail.sidebar.approvedAt")}
                          value={formatDate(detail.approvedAt)}
                        />
                      </>
                    )}
                </Stack>
              )}
            </Paper>

            {/* Notes card — only shown when the submission has notes */}
            {typeof detail?.notes === "string" && detail.notes.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: "20px",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                    mb: 1,
                  }}
                >
                  {t("requestDetail.sidebar.notes")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                  {detail.notes}
                </Typography>
              </Paper>
            )}

            {/* Rejection reason card — only shown for Rejected/Returned submissions */}
            {typeof detail?.rejectionReason === "string" &&
              detail.rejectionReason.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: "20px",
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    backgroundColor: alpha(theme.palette.warning.main, 0.04),
                    borderLeft: `4px solid ${theme.palette.warning.main}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "warning.main",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "block",
                      mb: 1,
                    }}
                  >
                    {t("requestDetail.sidebar.rejectionReason")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                    {detail.rejectionReason}
                  </Typography>
                </Paper>
              )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RequestDetail;
