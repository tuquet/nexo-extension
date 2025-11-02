import OptionsFooter from './OptionsFooter';
import OptionsHeader from './OptionsHeader';
import AdvancedTab from '../tabs/AdvancedTab';
import AIModelsTab from '../tabs/AIModelsTab';
import DisplayTab from '../tabs/DisplayTab';
import GeneralTab from '../tabs/GeneralTab';
import TTSTab from '../tabs/TTSTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@extension/ui';

const OptionsLayout = () => (
  <div className="bg-background min-h-screen">
    <OptionsHeader />

    <main className="mx-auto max-w-6xl px-4 py-8">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai-models">AI Models</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="tts">TTS & Audio</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="ai-models" className="space-y-4">
          <AIModelsTab />
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          <DisplayTab />
        </TabsContent>

        <TabsContent value="tts" className="space-y-4">
          <TTSTab />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <AdvancedTab />
        </TabsContent>
      </Tabs>
    </main>

    <OptionsFooter />
  </div>
);

export default OptionsLayout;
