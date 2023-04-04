const {webpackConfig, relDir} = require("./webpack.common");

module.exports = {
  entry: {
    index: relDir("src/index.ts"),
    demo: relDir("src/demo.ts"),
    drawing: relDir("src/drawing.ts"),
    scroller: relDir("src/scroller.ts"),
  },
  ...webpackConfig(false),
};
