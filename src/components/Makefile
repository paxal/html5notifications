sdk_dir := $(shell ls -d1 /usr/lib/firefox/sdk ~/xulrunner-sdk/sdk 2> /dev/null | head -n1)
idl_dir := $(shell ls -d1 /usr/include/firefox/idl ~/xulrunner-sdk/idl 2> /dev/null | head -n1)

SRC_JS  := $(wildcard *.js)
SRC_IDL := $(wildcard *.idl)

JS := $(shell ls -d1 `which js 2>/dev/null` ~/xulrunner-sdk/bin/xpcshell.exe 2> /dev/null | head -n1)

all: nsIPXLNotificationService.xpt nsIPXLNotification.xpt nsIPXLNotificationCenter.xpt $(SRC_JS)

.PHONY: $(SRC_JS)

$(SRC_JS):
	$(JS) -C $@

%.xpt: %.idl
	python ${sdk_dir}/bin/typelib.py $(addprefix -I , ${idl_dir}) -o $@ $<
