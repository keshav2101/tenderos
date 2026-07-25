# TenderOS Developer Setup & Guidelines

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

## Local Setup

```bash
git clone https://github.com/keshav2101/tenderos.git
cd tenderos
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.production.template .env
docker compose up -d
```

## Code Quality Standards

Before committing, run local formatting and linting:

```bash
ruff check services/ scripts/
black --check services/ scripts/
isort --check-only services/ scripts/
```
