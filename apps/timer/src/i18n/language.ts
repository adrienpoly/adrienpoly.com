import { en, type Messages } from "./en";
import { fr } from "./fr";

export type Language = "en" | "fr";

/** What the user chose in the settings. "auto" follows the browser. */
export type LanguageSetting = "auto" | Language;

export const MESSAGES: Record<Language, Messages> = { en, fr };

export const LANGUAGES = Object.keys(MESSAGES) as Language[];

/** Each language in its own words, for the settings. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  fr: "Français",
};

/**
 * The first of the browser's preferred languages (`navigator.languages`,
 * for example ["fr-FR", "en"]) that the app has. English when there is none.
 */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const language = LANGUAGES.find((candidate) => tag.toLowerCase().split("-")[0] === candidate);
    if (language) return language;
  }
  return "en";
}

export function resolveLanguage(setting: LanguageSetting, preferred: readonly string[]): Language {
  return setting === "auto" ? detectLanguage(preferred) : setting;
}
