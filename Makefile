XPI := ff-html5notifications.xpi

VERSION:=$(shell grep em:version src/install.rdf  | sed -r 's@.*>(.*)<.*@\1@')
JS_FILES :=$(shell find src/content -name *.js)
XML_FILES:=$(shell find src/ -name *.rdf)

JS := $(shell ls -d1 `which js 2>/dev/null` ~/xulrunner-sdk/bin/xpcshell.exe 2> /dev/null | head -n1)

.PHONY: clean $(JS_FILES) $(XML_FILES)

xpi: clean components content
	( cd src && zip "../$(XPI)" -x '*.svn*' -q -r {*.manifest,content,install.rdf,locale,defaults,components/*.xpt,components/*.js,components/*.idl} )
	mv $(XPI) ff-html5notifications-$(VERSION)-fx+sm.xpi

content: $(JS_FILES) $(XML_FILES)

$(JS_FILES):
	$(JS) -C $@
	
$(XML_FILES):
	xmllint --noout $@

components:
	$(MAKE) -C src/components

clean:
	rm -f $(XPI) *.xpi $(shell find src/components -name '*.xpt')
