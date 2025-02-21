import { build } from "esbuild";
import { join } from "path";

import { getDirName } from "./utils.js";

const LAMBDA_NODE16_RUNTIME = "nodejs16.x";
const LAMBDA_NODE18_RUNTIME = "nodejs18.x";
const LAMBDA_NODE20_RUNTIME = "nodejs20.x";

const LAMBDA_DEFAULT_RUNTIME = LAMBDA_NODE20_RUNTIME;

const SUPPORTED_RUNTIMES = [
  LAMBDA_NODE16_RUNTIME,
  LAMBDA_NODE18_RUNTIME,
  LAMBDA_NODE20_RUNTIME,
];

export class LambdaFormation {
  constructor(name, runtime, memorySize) {
    this.name = name;
    this.memorySize = memorySize;
    this.runtime = runtime || LAMBDA_DEFAULT_RUNTIME;

    if (!SUPPORTED_RUNTIMES.includes(this.runtime)) {
      const error = `Provided NodeJS version is not supported. Please use any of supported versions: ${SUPPORTED_RUNTIMES}`;
      throw error;
    }
  }

  slsRuntimeToEsbuildTargetMap = {
    [LAMBDA_NODE16_RUNTIME]: "node16",
    [LAMBDA_NODE18_RUNTIME]: "node18",
    [LAMBDA_NODE20_RUNTIME]: "node20",
  };

  async bundle() {
    const dirname = getDirName(import.meta.url);
    const path = join(dirname, "/lambda/createVisitor.ts");

    await build({
      entryPoints: [path],
      outfile: "dist/createVisitor.js",
      bundle: true,
      minify: true,
      sourcemap: true,
      platform: "node",
      target: this.slsRuntimeToEsbuildTargetMap[this.runtime],
    });
  }

  functionFormation() {
    return {
      [this.name]: {
        handler: "dist/createVisitor.handler",
        name: this.name,
        events: [
          {
            httpApi: {
              method: "POST",
              path: "/visitors",
            },
          },
        ],
        memorySize: this.memorySize,
        runtime: this.runtime,
        package: {
          individually: true,
          patterns: [
            "dist/**",
            "!node_modules/**",
            "!package.json",
            "!package-lock.json",
            "!README.md",
            "!slack/**",
            "!templates/**",
          ],
        },
      },
    };
  }
}
