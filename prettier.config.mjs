/** @type {import("prettier").Config} */
export default {
  trailingComma: "none",
  tabWidth: 2,
  semi: false,
  singleQuote: false,
  arrowParens: "avoid",
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  bracketSameLine: false,
  bracketSpacing: true,
  useTabs: false,
  proseWrap: "always",
  overrides: [
    {
      // LLM prompts: their line breaks are content, never rewrapped.
      files: "**/prompts/**/*.md",
      options: { proseWrap: "preserve" }
    }
  ]
}
