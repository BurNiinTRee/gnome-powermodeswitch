.PHONY: install debug

powermodeswitch@muehml.eu.shell-extension.zip: metadata.json *.js
	gnome-extensions pack --force

install: powermodeswitch@muehml.eu.shell-extension.zip
	gnome-extensions install powermodeswitch@muehml.eu.shell-extension.zip --force

debug:
	journalctl --user -f _COMM=.gnome-shell-wr
