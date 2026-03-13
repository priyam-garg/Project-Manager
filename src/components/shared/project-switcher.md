# ProjectSwitcher Component

## Overview

The `ProjectSwitcher` component is a reusable dropdown menu that allows users to quickly switch between projects. It includes search/filter functionality and integrates with the Zustand projects store.

## Features

- **Dropdown Menu**: Displays all available projects in a dropdown list
- **Search/Filter**: Real-time search to filter projects by name
- **Current Project Display**: Shows the currently selected project in the button
- **Navigation**: Automatically navigates to the selected project's board view
- **Loading State**: Displays loading indicator while projects are being fetched
- **Empty State**: Shows appropriate message when no projects match the search
- **Click Outside**: Closes dropdown when clicking outside the component
- **Visual Feedback**: Highlights the current project with a check mark
- **Responsive**: Works on all screen sizes

## Usage

### Basic Usage

```tsx
import { ProjectSwitcher } from '@/components/shared/project-switcher';

export function MyComponent() {
  return (
    <div className="w-64">
      <ProjectSwitcher />
    </div>
  );
}
```

### In Sidebar

```tsx
import { ProjectSwitcher } from '@/components/shared/project-switcher';

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background p-4">
      <div className="mb-4">
        <ProjectSwitcher />
      </div>
      {/* Other sidebar content */}
    </aside>
  );
}
```

### In Header

```tsx
import { ProjectSwitcher } from '@/components/shared/project-switcher';

export function Header() {
  return (
    <header className="flex items-center gap-4 border-b bg-background px-6 py-4">
      <h1 className="text-xl font-bold">Nexus</h1>
      <div className="w-64">
        <ProjectSwitcher />
      </div>
    </header>
  );
}
```

## Dependencies

- `next/navigation` - For routing
- `lucide-react` - For icons (ChevronDown, Search, Check)
- `@/stores/projects-store` - Zustand store for project state
- `@/modules/projects/hooks/use-projects` - Hook for fetching projects
- `@/components/ui/button` - Button component
- `@/components/ui/input` - Input component
- `@/lib/utils` - Utility functions (cn)

## State Management

The component connects to the Zustand projects store:

- **projects**: Array of all available projects
- **currentProjectId**: ID of the currently selected project
- **setCurrentProject**: Action to update the current project
- **getCurrentProject**: Selector to get the current project object

## Behavior

1. **On Mount**: Fetches projects using the `useProjects` hook
2. **On Click**: Opens/closes the dropdown menu
3. **On Search**: Filters projects by name in real-time
4. **On Select**: Updates the store, closes dropdown, and navigates to the project's board
5. **On Outside Click**: Closes the dropdown menu

## Accessibility

- Uses semantic HTML elements (button, input)
- Provides proper focus management
- Auto-focuses search input when dropdown opens
- Supports keyboard navigation
- Uses proper ARIA attributes

## Styling

The component uses Tailwind CSS classes and follows the design system:

- Consistent with other UI components (Button, Input)
- Supports dark mode through CSS variables
- Responsive design with proper spacing
- Smooth transitions and hover effects

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- **Requirement 7.4**: Project switcher dropdown in navigation
- **Requirement 7.5**: Search/filter capability for projects
- **Requirement 9**: Integration with Zustand state management
- **Requirement 8**: Uses shadcn/ui components (Button, Input)
- **Requirement 10**: Supports dark mode
- **Requirement 11**: Responsive design
