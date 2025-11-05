# CapCut Integration - Implementation Summary

## 📦 Files Created/Modified

### Backend (CapCut API)
1. **`upload_handler.py`** (NEW)
   - Flask Blueprint với endpoint `/api/upload/asset`
   - Nhận multipart/form-data từ Extension
   - Lưu files vào `uploads/{video|image|audio}/`
   - Trả về absolute path cho CapCut API

2. **`capcut_server.py`** (MODIFIED)
   - Import và register `upload_bp` Blueprint
   - Chạy cùng port 9001 (không cần server riêng)

### Frontend (Chrome Extension)
3. **`pages/new-tab/src/services/capcut-api.ts`** (NEW)
   - Class `CapCutAPIService` với methods:
     - `uploadAsset()` - Upload BLOB to server
     - `createDraft()` - Tạo draft mới
     - `addVideo()`, `addImage()`, `addAudio()` - Add media
     - `saveDraft()` - Start rendering
     - `pollTaskStatus()` - Poll với retry logic
     - `exportScript()` - Complete workflow
   - Error handling: `CapCutAPIError`, `UploadError`, `RenderTimeoutError`

4. **`pages/new-tab/src/stores/use-capcut-store.ts`** (NEW)
   - Zustand store quản lý state:
     - Export progress tracking
     - Draft/Task ID storage
     - Export history (persisted)
     - Server configuration
   - Actions: start, update, complete, fail, cancel export

5. **`pages/new-tab/src/components/script/modals/capcut-export-modal.tsx`** (NEW)
   - Modal UI với:
     - Server health check badge
     - Progress bar với stage tracking
     - Error/success alerts
     - Cancel/Download buttons
   - Auto-gather assets from script scenes

6. **`pages/new-tab/src/pages/script/detail.tsx`** (MODIFIED)
   - Import `CapCutExportModal`
   - Add state: `isCapCutModalOpen`
   - Pass prop to Header component

7. **`pages/new-tab/src/components/script/display/header.tsx`** (MODIFIED)
   - Add prop: `onOpenCapCutExport`
   - Button "Export to CapCut" với Film icon

8. **`CAPCUT_TESTING_GUIDE.md`** (NEW)
   - Comprehensive testing instructions
   - 6 test cases với expected results
   - Troubleshooting guide

---

## 🔄 Data Flow

```
1. User clicks "Export to CapCut"
   └─> CapCutExportModal opens
   └─> Health check: capcutAPI.healthCheck()

2. User clicks "Start Export"
   └─> Gather assets from script.acts[].scenes[]
       ├─ Videos: scene.generatedVideoId → db.videos.get()
       ├─ Images: scene.generatedImageId → db.images.get()
       └─ Audios: dialogue.generatedAudioId → db.audios.get()

3. Call capcutAPI.exportScript()
   │
   ├─> Stage 1: createDraft() → Get draft_id
   │   POST http://localhost:9001/create_draft
   │   Response: { draft_id, draft_url }
   │
   ├─> Stage 2: Upload assets (parallel)
   │   ├─ uploadAsset(videoBlob) → POST /api/upload/asset
   │   ├─ uploadAsset(imageBlob) → POST /api/upload/asset
   │   └─ uploadAsset(audioBlob) → POST /api/upload/asset
   │   Each returns: { local_path: "/path/to/file.ext" }
   │
   ├─> Stage 3: Add media to draft
   │   ├─ addVideo({ draftId, videoPath: local_path })
   │   ├─ addImage({ draftId, imagePath: local_path })
   │   └─ addAudio({ draftId, audioPath: local_path })
   │
   ├─> Stage 4: Save draft & start render
   │   POST http://localhost:9001/save_draft
   │   Response: { task_id }
   │
   └─> Stage 5: Poll task status (every 5s, max 10 minutes)
       Loop: POST /query_task_status { task_id }
       Until: status === 'success' → Return video_url
              status === 'failed' → Throw error
              timeout → Throw RenderTimeoutError

4. On Success
   └─> Show "Download Video" button
   └─> Save to exportHistory in store

5. On Error
   └─> Show error alert
   └─> Update history with failed status
```

---

## 🎨 UI/UX Features

### Modal States
1. **Initial** (Server connected)
   - Instructions box
   - "Start Export" button enabled

2. **Initial** (Server offline)
   - Red alert: "CapCut server is not running..."
   - Button disabled

3. **Exporting**
   - Progress bar with percentage
   - Current stage text (e.g., "Uploading assets 25%")
   - "Cancel Export" button (destructive variant)

4. **Success**
   - Green success alert
   - "Download Video" button
   - "Close" button

5. **Error**
   - Red error alert with message
   - "Close" button

### Progress Stages
- 0-5%: Creating draft
- 5-35%: Uploading assets (divided by asset count)
- 35-40%: Adding media to draft
- 40-50%: Starting render
- 50-100%: Rendering video (from server progress)

---

## 🔐 Security Considerations

**SKIPPED** (personal self-hosted tool):
- No API key validation
- No rate limiting
- No file size restrictions (backend only)
- No user authentication
- Direct HTTP (not HTTPS)

**Production Recommendations** (nếu deploy public):
- Add API key header: `X-API-Key`
- Implement rate limiting (Flask-Limiter)
- Add file size validation: max 500MB
- Use HTTPS with SSL certificate
- Add CORS whitelist

---

## ⚙️ Configuration Options

### Backend (config.json)
```json
{
  "port": 9001,
  "draft_domain": "https://www.capcutapi.top"
}
```

### Frontend (Store)
```typescript
useCapCutStore.getState().setServerUrl('http://localhost:9001');
```

### Timeouts & Limits
- Upload timeout: Default (no explicit limit)
- Poll interval: 5 seconds
- Max poll attempts: 120 (10 minutes total)
- Concurrent uploads: Parallel (Promise.all)

---

## 🧪 Testing Strategy

### Unit Tests (Recommended for production)
- `capcut-api.ts`: Mock fetch, test error handling
- `use-capcut-store.ts`: Test state transitions
- `upload_handler.py`: Test file validation, hash generation

### Integration Tests
- See `CAPCUT_TESTING_GUIDE.md` for manual test cases

### Performance Tests
- Upload 10 videos (100MB total) → Should complete in <5 minutes
- Render 30-second video → Should complete in <3 minutes

---

## 📈 Monitoring & Observability

### Frontend Metrics
- Export success rate: `exportHistory.filter(i => i.status === 'success').length`
- Average completion time: `completedAt - createdAt`
- Common errors: Group by error message

### Backend Metrics
- Upload endpoint response time
- Render task completion time
- Failed uploads count

### Logs to Watch
```bash
# Backend
"POST /api/upload/asset" - Check for 500 errors
"POST /save_draft" - Check for timeout errors

# Frontend (Console)
"CapCutAPIError" - Network/server errors
"RenderTimeoutError" - Long render times
```

---

## 🚀 Future Enhancements

### Priority 1 (High Impact)
- [ ] Add retry logic for failed uploads (exponential backoff)
- [ ] Implement upload progress tracking (XMLHttpRequest instead of fetch)
- [ ] Add export history UI (list past exports, re-download)
- [ ] Cache uploaded assets (avoid re-upload same file)

### Priority 2 (Nice to Have)
- [ ] Batch upload optimization (compress before upload)
- [ ] Preview draft before rendering
- [ ] Custom render settings (quality, format)
- [ ] Export templates (save draft config for reuse)

### Priority 3 (Advanced)
- [ ] WebSocket for real-time render progress (replace polling)
- [ ] Distributed rendering (multiple CapCut servers)
- [ ] AI-based scene transitions (auto-select best transition)

---

## 📝 Known Limitations

1. **No parallel rendering**: One export at a time per user
2. **No resume**: If export fails, must restart from beginning
3. **No preview**: Can't preview draft before full render
4. **No editing**: Can't modify draft after creation (must re-export)
5. **Memory usage**: Large assets (>100MB) may cause browser slowdown

---

## 🎓 Architecture Decisions

### Why Flask Blueprint?
- ✅ Integrate với existing CapCut server (single port)
- ✅ Share configuration và utilities
- ❌ Alternative: Separate FastAPI server (more complex deployment)

### Why Zustand Store?
- ✅ Persist export history across sessions
- ✅ Reactive UI updates (progress bar)
- ✅ Centralized state management
- ❌ Alternative: React Context (no persistence)

### Why Polling instead of WebSocket?
- ✅ Simple implementation (no WebSocket server needed)
- ✅ Works with existing REST API
- ❌ Drawback: Latency (5s delay per update)
- 🔮 Future: Migrate to WebSocket when real-time needed

### Why Parallel Uploads?
- ✅ Faster completion (3 assets = 3x speed)
- ✅ Better UX (progress updates more frequently)
- ❌ Drawback: Network congestion if too many assets
- 🔧 Solution: Limit to 5 parallel uploads (not implemented yet)

---

## 📞 Support & Maintenance

### Common Questions

**Q: Tại sao cần upload? CapCut API không nhận URL trực tiếp?**
A: CapCut API nhận cả URL và local path. Nhưng assets từ IndexedDB chỉ có Blob, không có public URL. Upload server convert Blob → local path.

**Q: Có thể skip upload nếu assets đã có URL?**
A: Có! Modify `exportScript()` để check nếu asset có `remoteUrl` property, dùng trực tiếp thay vì upload.

**Q: Export có thể chạy trong background?**
A: Hiện tại không (modal phải mở). Có thể implement background export với Service Worker + Notifications.

**Q: Có giới hạn số lượng assets?**
A: Backend không giới hạn. Frontend có thể chậm nếu >50 assets (browser memory). Recommend <20 assets per export.

---

## ✅ Deployment Checklist

- [ ] CapCut server chạy stable (test 100 exports liên tục)
- [ ] Extension lint pass (no errors)
- [ ] All test cases pass (see CAPCUT_TESTING_GUIDE.md)
- [ ] Documentation complete (README, API docs)
- [ ] Error tracking setup (Sentry/LogRocket)
- [ ] Backup strategy for `uploads/` folder
- [ ] Monitor disk space (`uploads/` có thể lớn nhanh)

---

**Implementation Status**: ✅ COMPLETE (Ready for testing)
**Last Updated**: 2025-11-04
**Author**: GitHub Copilot + User
