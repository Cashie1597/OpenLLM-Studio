# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@yourdomain.com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

## Security Best Practices

When using OpenLLM Studio:

1. **API Keys**: Never commit API keys to the repository. Use `.env` files (which are gitignored).
2. **Updates**: Keep OpenLLM Studio and Ollama updated to the latest versions.
3. **Downloads**: Only download models from trusted sources (official Ollama library, verified HuggingFace repos).
4. **Network**: Be cautious when using models from unknown sources.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible

## Comments

We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.
