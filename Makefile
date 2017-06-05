default: build

prepare-angular:
	(cd angular; npm install)

build-angular:
	(cd angular; ./node_modules/.bin/grunt build)

assets/index.html: angular/build/assets/index.html
	cp $< $@

assets/index.min.js: angular/build/assets/index.min.js
	cp $< $@

build-angular-assets: build-angular assets/index.html assets/index.min.js

.PHONY: prepare-angular build-angular build-angular-assets

prepare: prepare-angular

build: build-angular-assets

dev:
	(cd angular; ./angular/node_modules/.bin/grunt dev)

clean:
	rm -rf angular/build/assets

full-clean: clean
	rm -rf angular/node_modules
	rm -rf angular/build

rebuild: clean build

full-rebuild: full-clean prepare build

.PHONY: default prepare build dev clean full-clean rebuild full-rebuild
