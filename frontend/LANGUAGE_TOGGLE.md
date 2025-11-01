# Language Toggle Feature

## Overview
The application now supports bilingual functionality with English (EN) and Brazilian Portuguese (PT-BR) languages.

## How It Works

### For Users
1. **Language Toggle Button**: Located near the profile section in the navigation sidebar (desktop) and header (mobile)
2. **Login/Register Pages**: Language toggle button is in the top-left corner
3. **Persistence**: Your language preference is saved in browser localStorage and persists across sessions
4. **Default Language**: English (EN)

### For Developers

#### Architecture
- **LanguageContext** (`src/context/LanguageContext.tsx`): React context that manages the language state
- **Translations** (`src/lib/translations.ts`): Contains all translations for both languages
- **localStorage**: Stores user preference with key `language`

#### Using Translations in Components

```tsx
import { useLanguage } from '@/context/LanguageContext';

function MyComponent() {
  const { language, setLanguage, t } = useLanguage();
  
  // Use translation function
  return <h1>{t('nav.dashboard')}</h1>;
  
  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt-BR' : 'en');
  };
}
```

#### Adding New Translations

Edit `src/lib/translations.ts`:

```typescript
export const translations = {
  en: {
    newSection: {
      newKey: 'English text',
    }
  },
  'pt-BR': {
    newSection: {
      newKey: 'Texto em português',
    }
  }
};
```

Then use in component:
```tsx
{t('newSection.newKey')}
```

## Current Translation Coverage

### Fully Translated
- Navigation menu items
- Login page
- Register page
- Common actions (save, cancel, edit, delete, etc.)
- Form labels
- Error messages

### Partially Translated
- Dashboard (navigation item only)
- Other pages use translation keys where available

## Future Enhancements
- Add translations for all remaining pages
- Support for additional languages
- User profile setting to persist language preference to database
- RTL language support
