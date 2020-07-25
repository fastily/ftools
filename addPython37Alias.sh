#!/bin/bash

#: Adds command to start python3.7 to the current user's .bash_profile on toolforge.  May have to logout and re-login
#: for changes to take effect.
#: 
#: Author: Fastily

printf "alias startPython3.7='webservice --backend=kubernetes python3.7 shell'\n" >> ~/.bash_profile