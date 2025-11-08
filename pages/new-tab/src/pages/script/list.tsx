/**
 * Scripts Management Page
 * Enhanced list view with search, filter, pagination matching Prompts page design
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  LoadingSpinner,
} from '@extension/ui';
import { useScriptActions } from '@src/hooks/use-script-actions';
import { useStoreHydration } from '@src/hooks/use-store-hydration';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Copy, Download, Edit, Film, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScriptStory } from '@src/db';

// Available genres for filtering
const GENRES = [
  { value: 'all', label: 'All Genres' },
  { value: 'Thiền', label: 'Thiền' },
  { value: 'Mentor', label: 'Mentor' },
  { value: 'Drama', label: 'Drama' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Horror', label: 'Horror' },
  { value: 'Action', label: 'Action' },
  { value: 'Romance', label: 'Romance' },
  { value: 'Sci-Fi', label: 'Sci-Fi' },
] as const;

const ScriptListPage = () => {
  const navigate = useNavigate();
  const savedScripts = useScriptsStore(s => s.savedScripts);
  const hasHydrated = useStoreHydration();

  // Use script actions hook for reusable logic
  const { handleDelete: deleteScript, handleDuplicate, handleExport, handleImport } = useScriptActions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<ScriptStory | null>(null);

  // Filter scripts based on search and genre
  const filteredScripts = savedScripts.filter(script => {
    const matchesSearch =
      searchQuery === '' ||
      script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.logline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.themes?.some(theme => theme.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre = selectedGenre === 'all' || script.genre?.includes(selectedGenre);

    return matchesSearch && matchesGenre;
  });

  const handleDeleteConfirmed = async (script: ScriptStory) => {
    await deleteScript(script);
    setIsDeleteDialogOpen(false);
    setScriptToDelete(null);
  };

  const openDeleteDialog = (script: ScriptStory) => {
    setScriptToDelete(script);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateNew = () => {
    navigate('/script/create');
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scripts</CardTitle>
              <CardDescription>Manage your script collection</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 size-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="mr-2 size-4" />
                Import
              </Button>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 size-4" />
                New Script
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by title, logline, or themes (e.g., Love, Revenge)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {GENRES.map(genre => (
                <Badge
                  key={genre.value}
                  variant={selectedGenre === genre.value ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedGenre(genre.value)}>
                  {genre.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Scripts List */}
          {filteredScripts.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {searchQuery || selectedGenre !== 'all' ? (
                <>
                  <p>No scripts found matching your filters</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('all');
                    }}>
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p>No scripts yet</p>
                  <Button variant="link" onClick={handleCreateNew}>
                    Create your first script
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScripts.map(script => {
                const sceneCount = script.acts.reduce((sum, act) => sum + act.scenes.length, 0);

                return (
                  <Card key={script.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Title and Genres */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Film className="text-muted-foreground size-4" />
                            <button
                              className="cursor-pointer font-semibold hover:underline"
                              onClick={() => navigate(`/script/${script.id}`)}>
                              {script.title}
                            </button>
                            {script.genre && script.genre.length > 0 && (
                              <>
                                {script.genre.map(g => (
                                  <Badge key={g} variant="secondary">
                                    {g}
                                  </Badge>
                                ))}
                              </>
                            )}
                          </div>

                          {/* Logline */}
                          {script.logline && (
                            <p className="text-muted-foreground line-clamp-2 text-sm">{script.logline}</p>
                          )}

                          {/* Metadata row */}
                          <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                            {script.tone && <Badge variant="outline">{script.tone}</Badge>}
                            {script.characters && script.characters.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {script.characters.length} characters
                              </span>
                            )}
                            {sceneCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Film className="size-3" />
                                {sceneCount} scenes
                              </span>
                            )}
                          </div>

                          {/* Themes as tags */}
                          {script.themes && script.themes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {script.themes.map(theme => (
                                <Badge key={theme} variant="outline" className="">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(script)} title="Duplicate">
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/script/${script.id}`)}
                            title="Edit">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(script)} title="Delete">
                            <Trash2 className="text-destructive size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Script</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{scriptToDelete?.title}"? This action will permanently delete the script
              and all related assets (images, videos, audio). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => scriptToDelete && handleDeleteConfirmed(scriptToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScriptListPage;
