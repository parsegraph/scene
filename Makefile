DIST_NAME = scene

SCRIPT_FILES = \
	src/index.ts \
	src/Transformed.ts \
	src/WorldRenderable.ts \
	src/AbstractScene.ts \
	src/WorldLabel.ts \
	src/WorldTransform.ts \
	src/render.ts \
	src/viewport/input.ts \
	src/viewport/index.ts \
	src/viewport/mouse.ts \
	src/viewport/key.ts \
	src/viewport/viewport.ts \
	src/viewport/InputViewport.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS =

include ./Makefile.microproject
