import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';
import path from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((currentConfig) => {
  const withTailwind = enableTailwind(currentConfig);
  const rootDir = process.cwd(); // Points to c:\juri_AI\v1.6.5_anty - Copia\remotion

  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...withTailwind.resolve?.alias,
        "@": path.resolve(rootDir, "../frontend/src"),
      },
      modules: [
        ...(withTailwind.resolve?.modules || ["node_modules"]),
        path.resolve(rootDir, "../frontend/node_modules"),
      ],
    },
    module: {
      ...withTailwind.module,
      rules: [
        ...(withTailwind.module?.rules || []),
        {
          test: /\.m?jsx?$/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.tsx?$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
  };
});
