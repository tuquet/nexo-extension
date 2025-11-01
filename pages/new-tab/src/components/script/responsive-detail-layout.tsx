import { Tabs, TabsContent, TabsList, TabsTrigger } from '@extension/ui';
import { QUERIES } from '@src/constants';
import { useMediaQuery } from '@src/hooks/use-media-query';
import type React from 'react';

interface ResponsiveDetailLayoutProps {
  scriptContent: React.ReactNode;
  assetContent: React.ReactNode;
}

const ResponsiveDetailLayout: React.FC<ResponsiveDetailLayoutProps> = ({ scriptContent, assetContent }) => {
  const isMobile = useMediaQuery(QUERIES['2xl']);

  if (isMobile) {
    // Mobile View: Tabs
    return (
      <div className="p-4">
        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="script">Kịch bản</TabsTrigger>
            <TabsTrigger value="assets">Tài sản</TabsTrigger>
          </TabsList>
          <TabsContent value="script" className="mt-4">
            {scriptContent}
          </TabsContent>
          <TabsContent value="assets" className="mt-4">
            {assetContent}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop View: 2 Columns
  return (
    <div className="flex h-full">
      <main className="flex-1 p-6">
        <div className="mx-auto">{scriptContent}</div>
      </main>
      <aside
        className="scrollbar-hidden sticky top-0 h-[calc(100vh-4rem)] w-[500px] flex-shrink-0 overflow-y-auto p-6"
        style={{ alignSelf: 'flex-start' }}>
        {assetContent}
      </aside>
    </div>
  );
};

export default ResponsiveDetailLayout;
