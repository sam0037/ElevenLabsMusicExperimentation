# Makefile for ExperimentingElevenLabsLocal

# Variables
INSTALL_CMD = npm install
BUILD_CMD = npm run build
DEV_CMD = npm run dev

.PHONY: install build dev

install:
	$(INSTALL_CMD)

build:
	$(BUILD_CMD)

dev:
	$(DEV_CMD)
