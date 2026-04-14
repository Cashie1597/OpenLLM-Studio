# Contributing to OpenLLM Studio

First off, thank you for considering contributing to OpenLLM Studio! 🎉

It's people like you that make OpenLLM Studio such a great tool for the local LLM community.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Found something broken? Let us know!
- 💡 **Suggest features** - Have an idea? We'd love to hear it!
- 📝 **Improve documentation** - Help others understand the project
- 🎨 **Design improvements** - Make the UI even better
- 🧪 **Write tests** - Help us maintain quality
- 💻 **Submit code** - Fix bugs or add features

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openllm-studio.git
   cd openllm-studio
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes**
6. **Test your changes**:
   ```bash
   npm run tauri dev
   cd src-tauri && cargo test
   ```
7. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request**

## 📋 Development Guidelines

### Code Style

**TypeScript/React:**
- Use functional components with hooks
- Follow existing code structure
- Use TypeScript strict mode
- Add types for all props and functions
- Use Tailwind CSS for styling

**Rust:**
- Follow Rust conventions
- Add documentation comments for public APIs
- Write unit tests for new functionality
- Use `cargo fmt` before committing
- Run `cargo clippy` to catch issues

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add voice input support
fix: resolve download retry timeout issue
docs: update installation instructions
```

### Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass**: `cargo test`
4. **Update CHANGELOG.md** with your changes
5. **Link related issues** in your PR description
6. **Request review** from maintainers

### Testing

- Write unit tests for new Rust code
- Test UI changes manually in dev mode
- Verify your changes work on your platform
- Check for console errors

## 🐛 Reporting Bugs

**Before submitting a bug report:**
- Check if the bug has already been reported
- Try to reproduce it with the latest version
- Collect relevant information (OS, version, logs)

**When submitting a bug report, include:**
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/GIFs if applicable
- System information (OS, RAM, GPU)
- Console logs if relevant

Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

## 💡 Suggesting Features

**Before suggesting a feature:**
- Check if it's already been suggested
- Consider if it fits the project's scope
- Think about how it benefits users

**When suggesting a feature, include:**
- Clear description of the feature
- Why it would be useful
- How it might work
- Examples from other tools (if applicable)

Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

## 📝 Documentation

Help us improve documentation:
- Fix typos and grammar
- Add missing information
- Improve clarity
- Add examples
- Update screenshots

Documentation lives in:
- `README.md` - Main documentation
- `docs/` - Detailed guides
- Code comments - Inline documentation

## 🎨 Design Contributions

We welcome UI/UX improvements:
- Mockups and designs
- Icon improvements
- Color scheme suggestions
- Accessibility enhancements
- Animation ideas

Please open an issue first to discuss design changes.

## 🧪 Testing

Help us test:
- Try new features in development
- Test on different platforms (Windows, macOS, Linux)
- Test with different hardware configurations
- Report edge cases and unusual behavior

## 💬 Community

- **Discord**: [Join our server](https://discord.gg/YOUR_INVITE)
- **GitHub Discussions**: Ask questions, share ideas
- **Twitter**: [@yourusername](https://twitter.com/yourusername)

## 📜 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Our Discord community

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/Icecubesaad/OpenLLM-Studio/discussions)
- Ask in [Discord](https://discord.gg/YOUR_INVITE)
- Email: m.saadurrehmanweb@gmail.com

---

**Thank you for contributing to OpenLLM Studio!** 🚀

Every contribution, no matter how small, makes a difference.
