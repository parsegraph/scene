const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  entry: {
    index: relDir("src/index.ts"),
    demo: relDir("src/demo/scene.ts"),
    drawing: relDir("src/demo/drawing.ts"),
    scroller: relDir("src/demo/scroller.ts"),
  },
  ...webpackConfig(false),
};
