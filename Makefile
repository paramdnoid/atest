.PHONY: dev-landing dev-web dev-mobile api infra-up infra-down full-up full-down e2e-web-seed e2e-web

dev-landing:
	pnpm --filter @zunftgewerk/landing dev

dev-web:
	pnpm --filter @zunftgewerk/web dev

dev-mobile:
	pnpm --filter @zunftgewerk/mobile start

api:
	cd services/api && eval $$(grep -v '^\s*#' ../../.env | grep -v '^\s*$$' | grep -v 'JWT_PRIVATE_KEY_PEM\|JWT_PUBLIC_KEY_PEM' | sed 's/^/export /') && gradle bootRun

infra-up:
	docker compose -f infra/docker-compose.yml up -d

infra-down:
	docker compose -f infra/docker-compose.yml down

full-up:
	docker compose -f infra/docker-compose.yml --profile full up -d --build

full-down:
	docker compose -f infra/docker-compose.yml --profile full down

e2e-web-seed:
	./scripts/e2e-seed-web-user.sh

e2e-web:
	./scripts/e2e-seed-web-user.sh
	pnpm --filter @zunftgewerk/web run test:e2e
