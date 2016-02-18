pandoc -f markdown --output=output.html --filter "plantuml-filter.cmd" input.md --self-contained -c buttondown.css

