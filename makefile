
.PHONY: js
js:
	mkdir -p output
	mkdir -p output/js
	tsc src/core/*.ts src/*.ts --module es2020 --lib es2020,dom --target es2020 --outDir output/js

server:
	(cd output; python3 -m http.server)

linecount:
	(cd src; find . -name '*.ts' | xargs wc -l)
