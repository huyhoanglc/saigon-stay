import { useTranslation } from "react-i18next";
import Container from "../components/Container";

export default function JobsPage() {
  const { t } = useTranslation();

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("jobs.title")}</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        {t("jobs.comingSoon")}
      </p>
    </Container>
  );
}
