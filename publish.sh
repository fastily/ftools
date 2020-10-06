#!/usr/bin/env bash

#: Generates and publsihes ftools to toolforge.
#:
#: PRECONDITION:
#: 		1) jinja2html is installed
#:      2) You have toolforge access
#:
#: Author: Fastily

cd "${0%/*}" &> /dev/null

jinja2html --generate && scp -r out/* toolforge:/data/project/ftools/public_html