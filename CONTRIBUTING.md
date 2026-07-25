# Contributing to TenderOS

Thank you for your interest in contributing to TenderOS — India's AI-native Procurement Intelligence Platform.

## Quick Start

1. Fork and clone the repository
2. Copy `.env.production.template` → `.env`
3. Run `docker compose up -d`
4. Make your changes in a feature branch
5. Run tests: `make test`
6. Submit a Pull Request

## Development Setup

```bash
git clone https://github.com/<your-fork>/tenderos.git
cd tenderos
cp .env.production.template .env
# Fill in your API keys in .env
docker compose up -d
```

## Code Standards

- **Python**: Follow PEP 8; run `ruff check` before committing
- **TypeScript**: Follow project ESLint config
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Tests**: All new features must include tests

## Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated for changes
- [ ] Documentation updated if needed
- [ ] No secrets or credentials committed
- [ ] Docker builds pass locally

## Reporting Issues

Use the GitHub issue templates:
- 🐛 [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)

## Indian Procurement Domain Context

TenderOS is purpose-built for India's government procurement ecosystem (GeM, CPPP, IREPS, PSUs). 
Please ensure any contributions align with:
- Indian procurement terminology (EMD, BOQ, NIT, LOA, L1, MSME, etc.)
- GFR 2017 compliance requirements
- Make in India / Startup India provisions

## License

By contributing, you agree your contributions are licensed under the MIT License.
