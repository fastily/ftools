#!/usr/bin/env bash

#: Generates and publishes ftools to toolforge.
#:
#: PRECONDITION:
#: 		1) jinja2html is installed
#:      2) You have toolforge access
#:
#: Author: Fastily

cd "${0%/*}" &> /dev/null

if ! command -v jinja2html &> /dev/null; then
    printf "jinja2html is not available.  Please either install it or remember to start your virtualenv :)\n"
    exit
fi

jinja2html --generate && scp -r out/* toolforge:/data/project/ftools/public_html