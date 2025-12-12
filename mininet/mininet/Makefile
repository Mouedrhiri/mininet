SHELL := /bin/bash

.PHONY: install start report presentation

install:
	cd backend && npm install
	node backend/init_db.js

start:
	node backend/src/app.js

report:
	pdflatex -output-directory report report/rapport.tex

presentation:
	pdflatex -output-directory presentation presentation/presentation.tex
