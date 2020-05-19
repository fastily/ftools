#!/bin/bash

#: Copies contents of out to web server directory
#:
#: PRECONDITION:
#: 		1) Web server has been started (run "webserver start")
#: Author: Fastily

publicHtmlDir="public_html"
rootPublicHtmlDir=~/"${publicHtmlDir}"

## Copy public_html
printf "Copying public_html...\n"
mkdir -p "${rootPublicHtmlDir}"

cp -Rf "out"/* "${rootPublicHtmlDir}"/

printf "OK\n"