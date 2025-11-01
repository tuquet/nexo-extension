import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  LoadingSpinner,
} from '@extension/ui';
import ScriptCreateButton from '@src/components/script/script-create-button';
import { useStoreHydration } from '@src/hooks/use-store-hydration';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { ScriptStory } from '@src/types';

const ScriptListPage = () => {
  const navigate = useNavigate();
  const savedScripts = useScriptsStore(s => s.savedScripts);
  const deleteActiveScript = useScriptsStore(s => s.deleteActiveScript);
  const hasHydrated = useStoreHydration();

  const handleDelete = async (script: ScriptStory) => {
    // Truyền ID vào để xóa, không cần select trước
    await deleteActiveScript(script.id as number);
  };

  if (!hasHydrated) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Danh sách Kịch bản</h1>
        <ScriptCreateButton />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Logline</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedScripts.length > 0 ? (
              savedScripts.map(script => (
                <TableRow key={script.id}>
                  <TableCell className="font-medium">
                    <Link to={`/script/${script.id}`} className="hover:underline">
                      {script.title}
                    </Link>
                  </TableCell>
                  <TableCell>{script.logline}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/script/${script.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn kịch bản "{script.title}" và
                            tất cả tài sản liên quan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleDelete(script)}>Xóa</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Chưa có kịch bản nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ScriptListPage;
