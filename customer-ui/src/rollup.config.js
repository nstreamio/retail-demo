import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import {terser} from "rollup-plugin-terser";
import * as pkg from "../package.json";

const script = "retail-demo-customer";

const external = [
  "@swim/util",
  "@swim/codec",
  "@swim/component",
  "@swim/collections",
  "@swim/constraint",
  "@swim/structure",
  "@swim/recon",
  "@swim/uri",
  "@swim/math",
  "@swim/time",
  "@swim/warp",
  "@swim/client",
  "@swim/model",
  "@swim/style",
  "@swim/theme",
  "@swim/view",
  "@swim/dom",
  "@swim/graphics",
  "@swim/controller",
  "@swim/button",
  "@swim/toolbar",
  "@swim/table",
  "@swim/window",
  "@swim/sheet",
  "@swim/panel",
  "@swim/gauge",
  "@swim/pie",
  "@swim/chart",
  "@swim/leaflet",
  "@swim/domain",
  "@swim/widget",
  "@swim/token",
];

const globals = Object.fromEntries(external.map(name => [name, "swim"]));

const beautify = terser({
  compress: false,
  mangle: false,
  output: {
    preamble: `// ${pkg.name} v${pkg.version} (c) ${pkg.copyright}`,
    beautify: true,
    comments: false,
    indent_level: 2,
  },
});

export default [
  {
    input: "../build/typescript/index.js",
    output: {
      file: `../build/javascript/${script}.min.js`,
      format: "esm",
      generatedCode: {
        preset: "es2015",
        constBindings: true,
      },
      sourcemap: true,
      plugins: [beautify],
    },
    external: external.concat("tslib"),
    plugins: [
      nodeResolve(),
      sourcemaps(),
    ],
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY") return;
      warn(warning);
    },
  },
  {
    input: "../build/typescript/index.js",
    output: {
      file: `../build/javascript/${script}.min.js`,
      name: "swim.retaildemo",
      format: "umd",
      globals: globals,
      generatedCode: {
        preset: "es2015",
        constBindings: true,
      },
      sourcemap: true,
      interop: "esModule",
      extend: true,
      plugins: [beautify],
    },
    external: external,
    plugins: [
      nodeResolve(),
      sourcemaps(),
    ],
    onwarn(warning, warn) {
      if (warning.code === "CIRCULAR_DEPENDENCY") return;
      warn(warning);
    },
  },
];
