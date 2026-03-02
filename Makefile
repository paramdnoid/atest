.PHONY: dev-landing dev-web dev-mobile api infra-up infra-down e2e-web-seed e2e-web

dev-landing:
	pnpm --filter @zunftgewerk/landing dev

dev-web:
	pnpm --filter @zunftgewerk/web dev

dev-mobile:
	pnpm --filter @zunftgewerk/mobile start

api:
	cd services/api && gradle bootRun

infra-up:
	docker compose -f infra/docker-compose.yml up -d

infra-down:
	docker compose -f infra/docker-compose.yml down

e2e-web-seed:
	./scripts/e2e-seed-web-user.sh

e2e-web:
	./scripts/e2e-seed-web-user.sh
	pnpm --filter @zunftgewerk/web run test:e2e
