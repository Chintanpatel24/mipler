# Contributing to MIPLER

Thank you for your interest in contributing to MIPLER! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mipler.git
   cd mipler
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/mipler/mipler.git
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run development server:
   ```bash
   pnpm run dev
   ```

3. In another terminal, run Electron:
   ```bash
   pnpm run electron-dev
   ```

## Types of Contributions

### Adding New OSINT Tools

1. Edit `lib/osint-tools.ts`
2. Create a new tool following the interface:
   ```typescript
   export const MyNewTool: OSINTTool = {
     id: 'my_new_tool',
     name: 'My New Tool',
     category: 'Category',
     description: 'Description of what the tool does',
     icon: 'IconName',
     execute: async (input: string) => {
       try {
         // Implementation
         return {
           success: true,
           result: processedData,
         };
       } catch (error: any) {
         return { success: false, error: error.message };
       }
     },
   };
   ```
3. Add to `OSINT_TOOLS` array
4. Test thoroughly with various inputs
5. Submit PR with description

### Bug Fixes

1. Check existing issues to avoid duplicates
2. Create a clear description of the bug
3. Include steps to reproduce
4. Submit PR with fix and test cases

### UI/UX Improvements

1. Discuss significant changes in an issue first
2. Follow the matblack theme (dark background, cyan accents)
3. Test on different screen sizes
4. Ensure accessibility

### Documentation

1. Fix typos and clarify confusing sections
2. Add examples and use cases
3. Update README if adding features
4. Keep documentation in sync with code

## Coding Standards

### TypeScript

```typescript
// Use proper typing
interface MyInterface {
  prop1: string;
  prop2: number;
}

// Use named exports
export const myFunction = () => {};

// Add JSDoc comments for public functions
/**
 * Processes data for OSINT analysis
 * @param data - Input data to process
 * @returns Processed result
 */
export const processData = (data: string): string => {
  // Implementation
};
```

### React Components

```typescript
// Use 'use client' for client components
'use client';

import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

/**
 * MyComponent description
 */
export const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};
```

### Styling

- Use Tailwind CSS classes
- Follow the matblack color scheme (dark backgrounds, cyan accents)
- Ensure proper contrast for accessibility
- Use semantic HTML

### Git Commits

Write clear commit messages:

```
feat: Add new email extraction tool
fix: Resolve workflow execution timing issue
docs: Update installation instructions
style: Improve mind map component styling
refactor: Optimize storage manager
test: Add tests for OSINT engine
```

Format: `type: brief description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Request Process

1. **Keep commits clean**: Rebase before submitting
   ```bash
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```

3. **Create Pull Request**:
   - Write a clear title
   - Describe changes in detail
   - Reference related issues (#123)
   - Add screenshots for UI changes

4. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Documentation
   - [ ] UI improvement

   ## Testing
   How to test these changes

   ## Screenshots
   (if applicable)

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

5. **Review process**:
   - Address feedback promptly
   - Use "push force" cautiously
   - Request re-review after changes

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test
pnpm test tool-executor
```

### Writing Tests

Create tests alongside features:

```typescript
// components/my-component.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Security Considerations

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Sanitize output to prevent XSS
- Review credential handling in custom tools
- Report security issues responsibly

## Performance

- Minimize re-renders in React components
- Use proper memoization (useMemo, useCallback)
- Optimize bundle size
- Profile before optimizing

## Accessibility

- Test with keyboard navigation
- Use semantic HTML
- Add alt text to images
- Ensure color contrast (WCAG AA standard)
- Test with screen readers

## Documentation

Update documentation when:
- Adding new features
- Changing API
- Fixing user-facing bugs
- Improving user workflows

## Helpful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Flow](https://reactflow.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

## Questions?

- Check existing issues and discussions
- Review the README
- Ask in GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for helping make MIPLER better!
