/**
 * swc-loader rules shared by the main, preload and renderer webpack configs.
 *
 * TypeScript 7 is the native compiler and has no JavaScript compiler API, so
 * webpack transpiles with swc and type checking runs through `tsc` (the
 * `typecheck` script). `.ts` sources parse without JSX, so `<T>value` casts
 * keep working; `.tsx` sources use the automatic React JSX runtime. A `.swcrc`
 * on disk is ignored, so every target compiles the same way.
 */
const ScriptTarget = "esnext"

/**
 * @param {{ development: boolean }} options `development` imports
 *   `react/jsx-dev-runtime` instead of `react/jsx-runtime`.
 * @returns {import("webpack").RuleSetRule[]}
 */
function createSwcRules({ development }) {
  const createRule = (test, tsx) => ({
    test,
    exclude: /node_modules/,
    use: {
      loader: "swc-loader",
      options: {
        swcrc: false,
        jsc: {
          target: ScriptTarget,
          parser: { syntax: "typescript", tsx },
          transform: {
            react: { runtime: "automatic", development }
          }
        }
      }
    }
  })

  return [createRule(/\.ts$/, false), createRule(/\.tsx$/, true)]
}

module.exports = { createSwcRules }
