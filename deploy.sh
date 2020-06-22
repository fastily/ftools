#!/bin/bash

#: Generates web pages and copies them to web server directory.  Must be run in an environment with Python 3.7+
#:
#: PRECONDITION:
#: 		1) Web server has been started (run "webserver start")
#:		2) The ftools repository has been cloned into the tool's home directory.
#:
#: Author: Fastily

j2hRoot="${HOME}/j2h"
j2hActivate="${j2hRoot}/bin/activate"

if [ ! -d "$j2hRoot" ]; then
	python3 -m venv "${j2hRoot}"
fi

source "${j2hActivate}"
if ! hash jinja2html > /dev/null; then
	pip3 install jinja2html
fi

cd "${HOME}/ftools"
jinja2html --generate
cp -Rf out/* "${HOME}/public_html"/