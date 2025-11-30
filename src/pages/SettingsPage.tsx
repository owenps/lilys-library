import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { ThemeName } from "@/types/database";

const themes: {
  name: ThemeName;
  label: string;
  description: string;
  preview: { bg: string; card: string; accent: string };
}[] = [
  {
    name: "flat-white",
    label: "Flat White",
    description: "Classic",
    preview: { bg: "#ffffff", card: "#fafafa", accent: "#171717" },
  },
  {
    name: "espresso",
    label: "Espresso",
    description: "Classic dark",
    preview: { bg: "#171717", card: "#262626", accent: "#fafafa" },
  },
  {
    name: "cappuccino",
    label: "Cappucino",
    description: "With oat milk",
    preview: { bg: "#fef7ed", card: "#fdf4e7", accent: "#92400e" },
  },
  {
    name: "spicy-chai",
    label: "Spicy Chai",
    description: "For days at the cottage",
    preview: { bg: "#2a2318", card: "#362e24", accent: "#c9a66b" },
  },
  {
    name: "matcha",
    label: "Matcha",
    description: "For early mornings",
    preview: { bg: "#faf5f0", card: "#f5ede4", accent: "#4d7c0f" },
  },
  {
    name: "london-fog",
    label: "London Fog",
    description: "For Winter weekends",
    preview: { bg: "#1a1e2e", card: "#232838", accent: "#7ba8fa" },
  },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Lily's Library experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose a theme that matches your reading mood
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                className={cn(
                  "relative flex flex-col gap-2 p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50",
                  theme === t.name
                    ? "border-primary"
                    : "border-transparent bg-muted/50",
                )}
              >
                {/* Theme preview */}
                <div
                  className="h-20 rounded-md overflow-hidden flex items-end p-2 gap-1"
                  style={{ backgroundColor: t.preview.bg }}
                >
                  <div
                    className="flex-1 h-12 rounded"
                    style={{ backgroundColor: t.preview.card }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: t.preview.accent }}
                  />
                </div>

                <div>
                  <Label className="font-medium">{t.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.description}
                  </p>
                </div>

                {theme === t.name && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            Lily's Library - A personal reading diary
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p className="text-muted-foreground">
            Made with love as a gift for Lily.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
