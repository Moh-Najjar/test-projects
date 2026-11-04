import React from "react";

import EditNoteIcon from "@mui/icons-material/EditNote";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useGetSubmissionDetails } from "../../core/hooks/useFormApi";
import Stepper from "../new-request/Stepper";
import Breadcrumbs from "../shared/Breadcrumbs";
import HeroBanner from "../shared/HeroBanner";

/** Edit page: loads the submission and renders the stepper prefilled; saving sends PUT /submissions/{id} */
const EditRequest: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { submissionId: submissionIdParam } = useParams<{ submissionId: string }>();

  // Only accept a positive integer ID from the URL
  const submissionId = Number(submissionIdParam);
  const isParamValid = Number.isInteger(submissionId) && submissionId > 0;

  const { data: detail, isError } = useGetSubmissionDetails(isParamValid ? submissionId : undefined);

  return (
    <Box component="main" sx={{ minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="xl">
        <Breadcrumbs />
        <HeroBanner
          title={t("editRequest.pageTitle")}
          subtitle={t("editRequest.pageSubtitle")}
          badgeLabel={t("editRequest.badgeLabel")}
          BadgeIcon={EditNoteIcon}
        />
        <Paper
          elevation={0}
          sx={{ p: { xs: "12px", md: 4 }, borderRadius: { xs: "16px", md: "24px" }, border: `1px solid ${theme.palette.divider}`, overflow: "hidden" }}
        >
          {!isParamValid || isError ? (
            <Alert severity="error">{t("common.errorLoading")}</Alert>
          ) : detail === undefined ? (
            <Box display="flex" justifyContent="center" minHeight={200} alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <Stepper editSubmission={detail} />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default EditRequest;
