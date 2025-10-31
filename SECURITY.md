# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **Do Not** Open a Public Issue

Please do not report security vulnerabilities through public GitHub issues, as this could put users at risk.

### 2. Report Privately

**Email:** isak.skogstad@me.com

**Subject:** `[SECURITY] Skolverket-MCP Vulnerability Report`

**Include:**
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)

### 3. What to Expect

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 7 days
- **Status Updates:** Regular updates on progress
- **Fix Timeline:** We aim to release patches within 30 days for critical issues

### 4. Disclosure Policy

- We follow a **coordinated disclosure** approach
- Security advisories will be published after fixes are released
- Contributors who report valid vulnerabilities will be credited (unless they prefer to remain anonymous)

## Security Best Practices

When using Skolverket-MCP:

### For Remote Server (Render)
- ✅ No authentication required (public API)
- ✅ Rate limiting is in place
- ✅ HTTPS enforced
- ⚠️ Do not expose sensitive data in queries

### For Local Installation
- ✅ Keep dependencies updated: `npm audit` and `npm update`
- ✅ Use environment variables for sensitive configuration
- ⚠️ Never commit `.env` files to version control
- ⚠️ Restrict file system access appropriately

## Known Security Considerations

### API Access
- This server connects to **Skolverkets öppna API:er** (public APIs)
- No authentication is required for Skolverket's public APIs
- No sensitive data is stored by this MCP server
- All API calls are read-only

### Data Privacy
- This server does **not** collect or store personal information
- Query logs may contain search terms but no user identification
- Data is sourced from public Swedish education databases

## Dependencies

We regularly monitor and update dependencies for security vulnerabilities:

```bash
npm audit
npm audit fix
```

## Security Updates

Subscribe to repository notifications to receive security updates:
- Watch this repository on GitHub
- Enable **"Security alerts"** in your GitHub notification settings

## Contact

For security concerns:
- **Email:** isak.skogstad@me.com
- **X/Twitter:** [@isakskogstad](https://x.com/isakskogstad)

---

**Last Updated:** 2024-10-31
