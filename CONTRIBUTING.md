# Contributing Guide

Thank you for your interest in contributing to Guerreiros do Segundo Lugar!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Create a new branch for your feature: `git checkout -b feature/amazing-feature`
4. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```
5. Set up environment variables (see README.md)
6. Start development servers:
   ```bash
   # Backend (terminal 1)
   cd backend && npm run dev
   
   # Frontend (terminal 2) 
   cd frontend && npm run dev
   ```

## Code Style

### Backend
- Use ESLint for code formatting
- Follow REST API conventions
- Use async/await for asynchronous operations
- Add proper error handling and validation
- Include JSDoc comments for complex functions

### Frontend
- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Ensure mobile-first responsive design
- Use semantic HTML elements

## Pull Request Process

1. Create a descriptive pull request title
2. Include a detailed description of changes
3. Reference any related issues
4. Ensure all tests pass
5. Update documentation if needed
6. Request review from maintainers

## Feature Requests

When requesting new features:
1. Check if the feature already exists or is planned
2. Create a detailed issue describing:
   - What problem it solves
   - How it should work
   - Any design considerations
   - Screenshots/mockups if applicable

## Bug Reports

When reporting bugs:
1. Check if the bug is already reported
2. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser/environment details
   - Screenshots if helpful

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test on mobile devices
- Test with different user permissions (admin vs regular user)

## Database Changes

If your changes require database schema modifications:
1. Document the changes clearly
2. Consider backward compatibility
3. Provide migration instructions

## Security

- Never commit sensitive information (API keys, passwords)
- Follow security best practices
- Report security vulnerabilities privately

## Questions?

Feel free to ask questions by creating an issue or reaching out to maintainers.