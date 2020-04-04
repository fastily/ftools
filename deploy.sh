#!/bin/bash

#: Copies contents of public_html to web server
#:
#: PRECONDITION:
#: 		1) Web server has been started.
#: Author: Fastily

publicHtmlDir="public_html"
rootPublicHtmlDir=~/"${publicHtmlDir}"

## Copy public_html
printf "Copying public_html...\n"
mkdir -p "${rootPublicHtmlDir}"

cp -Rf "${publicHtmlDir}"/* "${rootPublicHtmlDir}"/

printf "Done!\n"