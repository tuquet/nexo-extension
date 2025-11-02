pages/options/src/
├── Options.tsx                    # Main component với ThemeProvider
├── components/
│   ├── layout/
│   │   ├── OptionsHeader.tsx      # Header với logo + theme toggle
│   │   ├── OptionsLayout.tsx      # Main layout wrapper
│   │   └── OptionsFooter.tsx      # Save/Reset footer
│   ├── tabs/
│   │   ├── GeneralTab.tsx         # Tab 1 content
│   │   ├── AIModelsTab.tsx        # Tab 2 content
│   │   ├── DisplayTab.tsx         # Tab 3 content
│   │   ├── TTSTab.tsx             # Tab 4 content
│   │   └── AdvancedTab.tsx        # Tab 5 content
│   └── sections/
│       ├── ApiConfigSection.tsx
│       ├── ModelSettingsSection.tsx
│       ├── ThemeSettingsSection.tsx
│       ├── VoiceMappingSection.tsx
│       ├── DataManagementSection.tsx
│       └── StorageUsageCard.tsx
├── hooks/
│   ├── use-options-form.ts        # React Hook Form setup
│   ├── use-storage-stats.ts      # Calculate storage usage
│   └── use-sync-settings.ts      # Sync với chrome.storage
└── stores/
    └── use-options-store.ts       # Local state cho options page