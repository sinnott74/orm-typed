module.exports = {
  // verbose: true,
  collectCoverage: true,
  projects: [
    {
      displayName: "Unit Tests",
      testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
      transform: {
        "^.+\\.tsx?$": "ts-jest"
      },
      testEnvironment: "node",
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
    },
    {
      displayName: "Integration Tests",
      testRegex: "(/__tests__/.*|(\\.|/)(e2e))\\.(jsx?|tsx?)$",
      transform: {
        "^.+\\.tsx?$": "ts-jest"
      },
      testEnvironment: "node",
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
    }
  ]
};
