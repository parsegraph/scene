DIST_NAME = scene

SCRIPT_FILES = \
	src/SceneList.ts \
	src/AbstractSceneList.ts \
	src/index.ts \
	src/Transformed.ts \
	src/CameraScene.ts \
	src/WorldRenderable.ts \
	src/demo/scroller.ts \
	src/demo/drawing.ts \
	src/demo/scene.ts \
	src/AbstractScene.ts \
	src/WorldLabel.ts \
	src/WorldTransform.ts \
	src/viewport/index.ts \
	src/viewport/constants.ts \
	src/viewport/CameraMouseController.ts \
	src/viewport/Viewport.ts \
	src/viewport/Cleared.ts \
	src/viewport/CameraKeyController.ts \
	src/viewport/Background.ts \
	src/WorldTransformScene.ts \
	src/input/index.ts \
	src/input/AllInputs.ts \
	src/input/KeyTimer.ts \
	src/input/KeyControllers.ts \
	src/input/MouseControllers.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS =

include ./Makefile.microproject
