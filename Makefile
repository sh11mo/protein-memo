IMAGE := asia-northeast1-docker.pkg.dev/orange-prod01/apps/protein-memo:latest

.PHONY: dev build push deploy tf-apply migrate

dev:
	docker compose up -d
	npm run dev

migrate:
	npm run db:migrate

build:
	docker build --platform linux/amd64 -t $(IMAGE) .

push: build
	docker push $(IMAGE)

tf-apply:
	cd terraform && terraform apply -var-file=terraform.tfvars

deploy: push tf-apply
