import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  toast,
  CardAction,
} from '@extension/ui'; // Assuming DownloadCloud is exported from here
import { VBEE_PROJECT_URL } from '@src/constants';
import { db } from '@src/db';
import { getVbeeProjectStatus } from '@src/services/vbee-service';
import { formatSrtTime, getAudioDuration, useScriptsStore, selectAllDialogues } from '@src/stores/use-scripts-store'; // Assuming DownloadCloud is exported from here
import { Mic, Link, Download, RefreshCw, AlertTriangle, Hourglass, Check, FileText } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Root } from '@src/types';
import type React from 'react';

interface VbeeProjectStatus {
  id: string;
  // status is not reliably present at the project level in the API response.
  // We'll infer it based on the presence of blocks and their content.
  status: 'processing' | 'done' | 'error' | string; // Allow other string values
  audio_link?: string;
  blocks: Array<{
    id: string;
    audio_link?: string; // audio_link might not exist if processing
  }>;
}

interface ScriptTtsAssetCardProps {
  onGenerateTts: () => void;
  script: Root | null;
  onSave: (script: Root) => Promise<void>;
}

const ScriptTtsAssetCard: React.FC<ScriptTtsAssetCardProps> = ({ onGenerateTts, script, onSave }) => {
  // Always call hooks at the top level
  const vbeeProjectId = script?.buildMeta?.vbeeProjectId;

  const [projectStatus, setProjectStatus] = useState<VbeeProjectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [isGeneratingSrt, setIsGeneratingSrt] = useState(false);
  const audioUrlRef = useRef<string | null>(null);
  const allDialogues = useScriptsStore(selectAllDialogues);

  const fetchStatus = useCallback(async () => {
    // We get the script from the store directly inside the fetch function
    // to avoid adding it to the useCallback dependency array, which causes an infinite loop.
    const currentScript = useScriptsStore.getState().activeScript;
    if (!vbeeProjectId || !currentScript) {
      console.warn('fetchStatus called without projectId or script.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { vbee_token } = await chrome.storage.local.get('vbee_token');
      if (!vbee_token) {
        throw new Error('Vui lòng trích xuất Vbee Token trong mục "Tạo dự án" trước.');
      }
      const response = await getVbeeProjectStatus(vbeeProjectId as string, vbee_token);
      const project = response.result.project as VbeeProjectStatus;
      setProjectStatus(project);

      // Always try to update any available audio links, don't wait for all to be "done".
      if (project.blocks?.length > 0) {
        const audioLinkMap = new Map(project.blocks.filter(b => b.audio_link).map(b => [b.id, b.audio_link as string]));

        if (audioLinkMap.size === 0) {
          toast.info('Vbee chưa xử lý xong. Vui lòng thử lại sau ít phút.');
          return;
        }
        const updatedScript = structuredClone(currentScript);
        let hasChanges = false;

        updatedScript.acts.forEach((act, actIndex) => {
          act.scenes.forEach((scene, sceneIndex) => {
            scene.dialogues?.forEach((dialogue, dialogueIndex) => {
              if (dialogue.vbeeBlockId && audioLinkMap.has(dialogue.vbeeBlockId)) {
                const newAudioLink = audioLinkMap.get(dialogue.vbeeBlockId)!;
                if (dialogue.audioLink !== newAudioLink) {
                  // Cập nhật trực tiếp trên bản sao thay vì gọi onUpdateField
                  updatedScript.acts[actIndex].scenes[sceneIndex].dialogues[dialogueIndex].audioLink = newAudioLink;
                  hasChanges = true;
                }
              }
            });
          });
        });

        if (hasChanges) {
          await onSave(updatedScript);
        }
        setLastSyncTime(new Date());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định.');
      toast.error(e instanceof Error ? e.message : 'Lỗi không xác định khi đồng bộ.');
    } finally {
      setIsLoading(false);
    }
  }, [vbeeProjectId, onSave]);

  const handleDownload = useCallback(async () => {
    if (!vbeeProjectId || !script?.id) return;

    setIsDownloading(true);
    toast.info('Đang tải và lưu file âm thanh vào tài sản...');

    try {
      const { vbee_token } = await chrome.storage.local.get('vbee_token');
      if (!vbee_token) {
        throw new Error('Không tìm thấy Vbee Token. Vui lòng trích xuất lại trong mục "Tạo dự án".');
      }

      // Step 1: Request the joined audio link from Vbee API
      const joinApiUrl = `https://vbee.vn/api/v1/projects/${vbeeProjectId}/audio?mode=joined`;
      const joinResponse = await fetch(joinApiUrl, {
        headers: {
          Authorization: `Bearer ${vbee_token}`,
        },
      });

      if (!joinResponse.ok) {
        throw new Error(`Lỗi khi yêu cầu file gộp: ${joinResponse.statusText} (${joinResponse.status})`);
      }

      const joinData = (await joinResponse.json()) as { result: { audio_link: string } };
      const downloadUrl = joinData.result.audio_link;

      if (!downloadUrl) {
        throw new Error('API không trả về đường dẫn file âm thanh.');
      }

      // Step 2: Fetch the audio file from the public URL (e.g., Google Storage)
      // This URL usually doesn't require authentication.
      const fileResponse = await fetch(downloadUrl, { mode: 'cors' });
      if (!fileResponse.ok) {
        throw new Error(`Lỗi tải file âm thanh: ${fileResponse.statusText}`);
      }
      const audioBlob = await fileResponse.blob();

      // Step 3: Save the blob to IndexedDB
      await db.audios.put({
        scriptId: script.id,
        data: audioBlob,
      });

      // Step 4: Create a URL for the local player and update the state
      const localUrl = URL.createObjectURL(audioBlob);
      setLocalAudioUrl(localUrl);

      toast.success('Đã lưu file âm thanh vào tài sản thành công!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi không xác định khi lưu file.');
    } finally {
      setIsDownloading(false);
    }
  }, [vbeeProjectId, script?.id]);

  const handleExportSrt = useCallback(async () => {
    if (!script?.id) return;

    setIsGeneratingSrt(true);
    toast.info('Đang tạo file phụ đề SRT...');

    try {
      const audioRecord = await db.audios.where({ scriptId: script.id }).first();
      if (!audioRecord) {
        throw new Error('Không tìm thấy file âm thanh đã lưu trong tài sản để tạo SRT.');
      }

      if (allDialogues.length === 0) {
        throw new Error('Kịch bản không có câu thoại nào để tạo phụ đề.');
      }

      const totalDuration = await getAudioDuration(audioRecord.data);
      const totalCharacters = allDialogues.reduce((sum, d) => sum + d.line.length, 0);
      const timePerChar = totalCharacters > 0 ? totalDuration / totalCharacters : 0;

      let srtContent = '';
      let cumulativeTime = 0;

      allDialogues.forEach((dialogue, index) => {
        const lineDuration = dialogue.line.length * timePerChar;
        const startTime = cumulativeTime;
        const endTime = startTime + lineDuration;
        srtContent += `${index + 1}\n`;
        srtContent += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
        srtContent += `${dialogue.line}\n\n`;
        cumulativeTime = endTime;
      });

      const srtBlob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(srtBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${script.alias || script.title.replace(/[^a-z0-9]/gi, '_') || 'subtitles'}.srt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi không xác định khi tạo file SRT.');
    } finally {
      setIsGeneratingSrt(false);
    }
  }, [script, allDialogues]);

  useEffect(() => {
    if (vbeeProjectId) {
      void fetchStatus();
    }
  }, [vbeeProjectId, fetchStatus]); // Include fetchStatus in dependency array

  useEffect(() => {
    // Function to revoke the old URL and clear state
    const cleanup = () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setLocalAudioUrl(null);
    };

    const loadAudioFromDb = async () => {
      cleanup(); // Clean up previous URL before loading a new one
      if (!script?.id) return;
      const audioRecord = await db.audios.where({ scriptId: script.id }).first();
      if (audioRecord) {
        const url = URL.createObjectURL(audioRecord.data);
        audioUrlRef.current = url; // Store in ref
        setLocalAudioUrl(url);
      }
    };

    void loadAudioFromDb();

    return cleanup; // Return the cleanup function
  }, [script?.id]);

  if (!script) {
    return null; // Don't render if there's no active script
  }

  if (!vbeeProjectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-slate-500" /> Lồng tiếng (TTS)
          </CardTitle>
          <CardDescription>Tạo file âm thanh cho toàn bộ kịch bản.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">Chưa có dự án lồng tiếng nào được tạo cho kịch bản này.</p>
          <Button onClick={onGenerateTts} className="w-full">
            Tạo dự án lồng tiếng
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="outline">Đang tải...</Badge>;
    }
    if (!projectStatus) return null;

    const isDone = projectStatus.blocks?.length > 0 && projectStatus.blocks.every(b => b.audio_link);

    if (projectStatus.status === 'done' || isDone) {
      return <Badge variant="outline">Hoàn thành</Badge>;
    } else if (projectStatus.status === 'error') {
      return <Badge variant="outline">Lỗi</Badge>;
    } else {
      return <Badge variant="outline">{projectStatus.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-slate-500" /> Lồng tiếng (TTS)
        </CardTitle>
        <CardDescription>Dự án Vbee ID: {vbeeProjectId}</CardDescription>
        <CardAction>{renderStatusBadge()}</CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !projectStatus && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Hourglass className="h-4 w-4 animate-spin" />
            <span>Đang kiểm tra trạng thái...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {lastSyncTime && !isLoading && !error && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Check className="h-4 w-4 text-green-500" />
            <span>Đồng bộ lần cuối lúc: {lastSyncTime.toLocaleTimeString()}</span>
          </div>
        )}
        {localAudioUrl && (
          <div>
            <p className="mb-2 text-sm text-slate-500">Âm thanh đã lưu trong tài sản:</p>
            <audio controls className="w-full" src={localAudioUrl}>
              <track kind="captions" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Button variant="outline" size="sm" onClick={() => void fetchStatus()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleDownload()}
            disabled={isDownloading || !vbeeProjectId}>
            <Download className={`mr-2 h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
            {isDownloading ? 'Đang lưu...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportSrt()}
            disabled={isGeneratingSrt || !localAudioUrl}>
            <FileText className={`mr-2 h-4 w-4 ${isGeneratingSrt ? 'animate-spin' : ''}`} />
            {isGeneratingSrt ? 'Đang tạo...' : 'SRT'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`${VBEE_PROJECT_URL}/${vbeeProjectId}`} target="_blank" rel="noopener noreferrer">
              <Link className="mr-2 h-4 w-4" />
              Vbee
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScriptTtsAssetCard;
