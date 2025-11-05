# CapCut Integration - Testing Guide

## 🚀 Quick Start

### 1. Start CapCut Server
```bash
cd d:\Repository\capcut-api
python capcut_server.py
```

Expected output:
```
 * Running on http://0.0.0.0:9001
```

### 2. Start Chrome Extension
```bash
cd d:\Repository\nexo-ext-react
pnpm dev
```

### 3. Load Extension in Chrome
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `d:\Repository\nexo-ext-react\dist\chrome-mv3-dev`

---

## 🧪 Testing Workflow

### Test 1: Health Check
**Goal**: Verify CapCut server is running

**Steps**:
1. Open Extension New Tab
2. Navigate to Script Detail page
3. Click "Export to CapCut" button
4. **Expected**: Modal opens without "server not running" error

**Troubleshooting**:
- If error appears, check CapCut server is running on port 9001
- Test manually: `curl http://localhost:9001/api/upload/health`

---

### Test 2: Upload Single Asset
**Goal**: Test upload handler

**Preparation**:
1. Create a script with at least 1 scene
2. Generate an image for the scene (click "Generate Image")

**Steps**:
1. Open Script Detail page
2. Click "Export to CapCut"
3. Click "Start Export"
4. **Expected**: 
   - Progress bar appears
   - Stage shows: "Uploading assets" → "Adding media to draft" → "Starting render"
   - No errors

**Verify Backend**:
```bash
# Check uploaded files
ls d:\Repository\capcut-api\uploads\image\
# Should see: {hash}.png
```

---

### Test 3: Full Export (Images + Videos + Audio)
**Goal**: Test complete workflow with multiple asset types

**Preparation**:
1. Create script with 3 scenes
2. Generate:
   - Scene 1: Image + Video
   - Scene 2: Image only
   - Scene 3: Image + 2 dialogues with audio

**Steps**:
1. Open Script Detail page
2. Click "Export to CapCut"
3. Click "Start Export"
4. **Expected**:
   - Progress: 0% → 5% (Create draft) → 35% (Upload) → 50% (Add media) → 100% (Render)
   - Total time: 2-5 minutes depending on asset count
   - Final result: "Export completed successfully!"
   - Download button appears

**Verify**:
```bash
# Check uploads folder structure
ls d:\Repository\capcut-api\uploads\
# Should see: video/, image/, audio/ folders with files
```

---

### Test 4: Cancel Export
**Goal**: Test abort functionality

**Steps**:
1. Start export (Test 3)
2. Wait until progress reaches ~30%
3. Click "Cancel Export"
4. **Expected**:
   - Export stops immediately
   - Error message: "Export cancelled by user"
   - Close button appears

---

### Test 5: Error Handling - No Assets
**Goal**: Test validation

**Preparation**:
1. Create script with scenes but NO generated assets

**Steps**:
1. Click "Export to CapCut"
2. Click "Start Export"
3. **Expected**:
   - Error appears: "No assets found. Please generate images, videos, or audio first."

---

### Test 6: Server Offline
**Goal**: Test connection error handling

**Steps**:
1. Stop CapCut server (`Ctrl+C`)
2. Open Export modal
3. **Expected**:
   - Red alert: "CapCut server is not running..."
   - "Start Export" button disabled

---

## 📊 Expected Results Summary

| Test | Duration | Success Criteria |
|------|----------|------------------|
| Health Check | <1s | Modal opens, no error |
| Upload Single Asset | 30-60s | Progress reaches 100%, no errors |
| Full Export | 2-5min | Video URL returned, downloadable |
| Cancel Export | Immediate | Export stops, error message shown |
| No Assets | <1s | Validation error displayed |
| Server Offline | <1s | Connection error + button disabled |

---

## 🐛 Common Issues & Solutions

### Issue 1: "Upload failed: Network error"
**Cause**: CORS or server not running
**Solution**:
```bash
# Check server logs for errors
# Verify port 9001 is not blocked by firewall
```

### Issue 2: "Render timeout after X seconds"
**Cause**: Video rendering takes too long (>10 minutes)
**Solution**:
- Reduce asset count (test with 1-2 scenes first)
- Check CapCut server CPU usage
- Increase timeout in `capcut-api.ts` (line ~430):
  ```typescript
  maxAttempts: 240, // 20 minutes instead of 10
  ```

### Issue 3: Modal doesn't open
**Cause**: Button not visible or script not loaded
**Solution**:
- Refresh page
- Check activeScript is loaded
- Check browser console for errors

### Issue 4: Progress stuck at 50%
**Cause**: `save_draft` API call failed
**Solution**:
```bash
# Check CapCut server logs
# Verify draft_id is valid
# Test manually:
curl -X POST http://localhost:9001/query_task_status \
  -H "Content-Type: application/json" \
  -d '{"task_id": "YOUR_TASK_ID"}'
```

---

## 📝 Logging & Debugging

### Frontend Logs (Extension)
Open DevTools Console:
```javascript
// Enable verbose logging
localStorage.debug = 'capcut:*'

// Check store state
useCapCutStore.getState()
```

### Backend Logs (CapCut Server)
```bash
# Server logs appear in terminal where capcut_server.py runs
# Look for:
# - POST /api/upload/asset
# - POST /create_draft
# - POST /add_video
# - POST /save_draft
# - POST /query_task_status
```

---

## ✅ Test Checklist

Before marking as complete, verify:

- [ ] CapCut server starts without errors
- [ ] Extension loads and opens Export modal
- [ ] Health check passes (no red alert)
- [ ] Single image upload works
- [ ] Multiple assets upload (video + image + audio)
- [ ] Progress bar updates correctly
- [ ] Polling completes and returns video URL
- [ ] Download button works
- [ ] Cancel button stops export
- [ ] Error validation works (no assets)
- [ ] Server offline detection works
- [ ] No console errors during full flow

---

## 🎯 Success Metrics

**Pass Criteria**:
- All 6 test cases pass
- No unhandled errors in console
- Video renders successfully (can be downloaded)
- User experience is smooth (no UI freezing)

**Failure Triggers**:
- Any test case fails repeatedly
- Server crashes during export
- Memory leaks (check Task Manager)
- CORS errors in browser

---

## 📞 Need Help?

If tests fail:
1. Check terminal logs (both Extension dev server and CapCut server)
2. Verify file structure: `uploads/video/`, `uploads/image/`, `uploads/audio/`
3. Test CapCut server manually with curl commands
4. Review browser DevTools Network tab for failed requests
