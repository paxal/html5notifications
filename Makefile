XPI := ff-html5notifications.xpi

VERSION:=$(shell grep em:version src/install.rdf  | sed -r 's@.*>(.*)<.*@\1@')
JS_FILES :=$(shell find src/content -name *.js)
XML_FILES:=$(shell find src/ -name *.rdf)

.PHONY: clean $(JS_FILES) $(XML_FILES)

xpi: clean components content
	( cd src && zip "../$(XPI)" -x '*.svn*' -q -r {*.manifest,content,install.rdf,locale,defaults,components/*.xpt,components/*.js,components/*.idl} )
	mv $(XPI) ff-html5notifications-$(VERSION)-fx.xpi

content: $(JS_FILES) $(XML_FILES)

$(JS_FILES):
	js -C $@
	
$(XML_FILES):
	xmllint --noout $@

components:
	$(MAKE) -C src/components

clean:
	rm -f $(XPI)
