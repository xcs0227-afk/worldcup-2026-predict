# 2026美加墨足球世界杯

一个面向中文数据型球迷的 2026 美加墨足球世界杯赛前预测分析网站原型。核心展示赛程、胜平负概率、预期进球、大小球倾向、解释因子、数据来源、更新时间和不确定性提示。

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

构建产物输出到 `dist/`。

## GitHub Pages 部署

项目已包含 GitHub Actions 工作流：

```text
.github/workflows/deploy-github-pages.yml
```

发布步骤：

1. 在 GitHub 新建一个仓库。
2. 把本地项目推送到该仓库的 `main` 分支。
3. 进入 GitHub 仓库 `Settings -> Pages`。
4. 在 `Build and deployment` 中选择 `GitHub Actions`。
5. 推送到 `main` 后，工作流会自动运行 `npm ci`、`npm run build`，并发布 `dist/`。

`vite.config.ts` 已自动适配 GitHub Pages 项目路径：在 GitHub Actions 中会使用 `/<repo-name>/` 作为 `base`，本地开发仍使用 `/`。

## 数据源策略

第一版采用三层数据兜底：

1. 实时源：`https://worldcup26.ir/get/games`
2. 公开赛程兜底：`https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`
3. 本地快照：内置样例数据

页面会显示当前数据状态：实时、兜底、快照或连接中。

## 重要限制

- 预测结果来自站内模型估算，不是第三方官方预测。
- 当前模型只覆盖两个指标：胜平负概率、进球数预测。
- 观看入口只展示公开观看信息状态，不嵌入未授权直播。
- 预测仅供赛前分析参考，不构成任何投资、投注或收益建议。

---

## Vite 原始说明

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
