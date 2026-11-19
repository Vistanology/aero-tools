# Dev tasks for aero-tools (static PWA, no build step).
# Usage: make run | make serve | make stop | make status

PORT ?= 8735
PIDFILE := .serve.pid
LOGFILE := .serve.log
URL := http://localhost:$(PORT)

.PHONY: run serve stop restart status

# Start the static server in the background and wait until it answers.
run:
	@command -v node >/dev/null 2>&1 || { echo "node não encontrado no PATH"; exit 1; }
	@# matar processo antigo pelo PID
	@if [ -f $(PIDFILE) ]; then PID=$$(cat $(PIDFILE)); if kill -0 $$PID 2>/dev/null; then echo "matando processo antigo pid $$PID"; kill $$PID 2>/dev/null || true; sleep 0.3; kill -9 $$PID 2>/dev/null || true; fi; rm -f $(PIDFILE); fi
	@# matar qualquer processo que esteja usando a porta
	@PIDS=$$(lsof -t -i :$(PORT) 2>/dev/null); if [ -n "$$PIDS" ]; then echo "matando processos ocupando porta $(PORT): $$PIDS"; kill $$PIDS 2>/dev/null || true; sleep 0.3; kill -9 $$PIDS 2>/dev/null || true; fi
	@PORT=$(PORT) nohup node serve.js > $(LOGFILE) 2>&1 & echo $$! > $(PIDFILE);
	@for i in 1 2 3 4 5 6 7 8 9 10; do curl -sf -o /dev/null $(URL) && break; sleep 0.3; done;
	@if curl -sf -o /dev/null $(URL); then echo "servindo em $(URL) (pid $$(cat $(PIDFILE)), log $(LOGFILE))"; else echo "falhou ao iniciar — veja $(LOGFILE)"; rm -f $(PIDFILE); exit 1; fi


# Run in the foreground (Ctrl+C to stop).
serve:
	PORT=$(PORT) node serve.js

stop:
	@if [ -f $(PIDFILE) ] && kill -0 "$$(cat $(PIDFILE))" 2>/dev/null; then \
		kill "$$(cat $(PIDFILE))" && rm -f $(PIDFILE); echo "servidor parado"; \
	else \
		rm -f $(PIDFILE); echo "nada rodando (sem $(PIDFILE) ativo)"; \
	fi

restart: stop run

status:
	@if [ -f $(PIDFILE) ] && kill -0 "$$(cat $(PIDFILE))" 2>/dev/null; then \
		echo "rodando (pid $$(cat $(PIDFILE))) em $(URL)"; \
	else \
		echo "parado"; \
	fi
