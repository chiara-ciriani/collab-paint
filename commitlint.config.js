module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nueva funcionalidad
        "fix", // Corrección de bug
        "docs", // Documentación
        "style", // Cambios de formato (no afectan el código)
        "refactor", // Refactorización
        "perf", // Mejoras de rendimiento
        "test", // Tests
        "chore", // Tareas de mantenimiento
        "ci", // CI/CD
        "build", // Build system
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
  },
};

