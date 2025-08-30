import { SplashCursor } from "@/components/ui/splash-cursor";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SplashCursorDemo() {
  const { t } = useLanguage();

  return (
    <PageContainer>
      <PageHeader
        title={t("demos.splashCursor")}
        description={t("demos.splashCursorDescription")}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("demos.aboutEffect")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            {t("demos.splashCursorExplanation")}
          </p>
          <Button>
            {t("demos.toggleEffect")}
          </Button>
        </CardContent>
      </Card>

      {/* The splash cursor effect is added globally */}
      <SplashCursor />
    </PageContainer>
  );
}
