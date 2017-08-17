default: build

prepare-angular:
	(cd angular; npm install)

build-angular:
	(cd angular; ./node_modules/.bin/grunt build)

assets/index.html: angular/build/assets/index.html
	cp $< $@
assets/vendor.js: angular/build/assets/vendor.js
	cp $< $@
assets/vendor.js.map: angular/build/assets/vendor.js.map
	cp $< $@
assets/styles.js: angular/build/assets/styles.js
	cp $< $@
assets/styles.js.map: angular/build/assets/styles.js.map
	cp $< $@
assets/index.js: angular/build/assets/index.js
	cp $< $@
assets/index.js.map: angular/build/assets/index.js.map
	cp $< $@

build-angular-assets: build-angular assets/index.html \
	assets/index.js assets/index.js.map \
	assets/styles.js assets/styles.js.map \
	assets/vendor.js assets/vendor.js.map

.PHONY: prepare-angular build-angular build-angular-assets

assets/UserAuthenticator-deployment-instructions.txt: runtime/UserAuthenticator/descriptor.yaml runtime/UserAuthenticator/UserAuthenticator.js runtime/UserAuthenticator/descriptor.yaml runtime/context-local.yaml
	twilio-runtime-utils -c runtime/context-local.yaml deploy runtime/UserAuthenticator/descriptor.yaml > $@

assets/CameraAuthenticator-deployment-instructions.txt: runtime/CameraAuthenticator/descriptor.yaml runtime/CameraAuthenticator/CameraAuthenticator.js runtime/CameraAuthenticator/descriptor.yaml runtime/context-local.yaml
	twilio-runtime-utils -c runtime/context-local.yaml deploy runtime/CameraAuthenticator/descriptor.yaml > $@

assets/AlertGenerator-deployment-instructions.txt: runtime/AlertGenerator/descriptor.yaml runtime/AlertGenerator/AlertGenerator.js runtime/AlertGenerator/descriptor.yaml runtime/context-local.yaml
	twilio-runtime-utils -c runtime/context-local.yaml deploy runtime/AlertGenerator/descriptor.yaml > $@

build-runtime: assets/UserAuthenticator-deployment-instructions.txt assets/CameraAuthenticator-deployment-instructions.txt assets/AlertGenerator-deployment-instructions.txt

.PHONY: build-runtime

prepare: prepare-angular

build: build-angular-assets # build-runtime

dev:
	(cd angular; ./node_modules/.bin/grunt dev)

clean:
	rm -rf angular/build/assets

full-clean: clean
	rm -f angular/package-lock.json
	rm -rf angular/node_modules
	rm -rf angular/build

rebuild: clean build

full-rebuild: full-clean prepare build

.PHONY: default prepare build dev clean full-clean rebuild full-rebuild
