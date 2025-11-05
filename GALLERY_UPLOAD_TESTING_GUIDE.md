# Gallery Upload Feature - Testing Guide

## 🎯 **Mục Đích**

Test tính năng **Upload Assets to CapCut** từ Gallery để:
1. ✅ Kiểm tra upload handler hoạt động độc lập
2. ✅ Đánh giá performance (upload speed, concurrent uploads)
3. ✅ Validate error handling (server offline, network errors)
4. ✅ UI/UX feedback rõ ràng

---

## 🚀 **Setup**

### 1. Start CapCut Server
```bash
cd d:\Repository\capcut-api
python capcut_server.py
```

**Expected Output**:
```
 * Running on http://0.0.0.0:9001
 * Serving Flask app 'capcut_server'
```

### 2. Start Extension
```bash
cd d:\Repository\nexo-ext-react
pnpm dev
```

### 3. Load Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `d:\Repository\nexo-ext-react\dist\chrome-mv3-dev`

---

## 🧪 **Test Cases**

### **Test 1: Basic Upload (1 Asset)**

**Goal**: Verify single file upload works

**Steps**:
1. Open Extension → Navigate to **Asset Gallery** (`/asset`)
2. Verify có ít nhất 1 asset (image/video/audio)
   - Nếu không có: Tạo script → Generate 1 image
3. Click button **"Chọn tài sản"** (top right)
4. Select 1 asset (checkbox appears on card)
5. Click **"Upload to CapCut (1)"** button
6. Modal opens với:
   - Server status: ✅ Green (CapCut server is running)
   - 1 asset in list with "Pending" status
7. Click **"Start Upload"**
8. **Expected**:
   - Status changes: Pending → Uploading → Success
   - Progress bar animates 0% → 100%
   - Green checkmark appears
   - Local path displayed: `d:\Repository\capcut-api\uploads\{type}\{hash}.ext`
9. Click **"Download Report"**
10. **Expected**: JSON file downloads với upload details

**Success Criteria**:
- ✅ No errors in console
- ✅ Progress bar reaches 100%
- ✅ Success status with local path
- ✅ Report downloads successfully

**Verify Backend**:
```bash
# Check file exists
ls d:\Repository\capcut-api\uploads\image\
# Should see: {hash}.png or {hash}.jpg
```

---

### **Test 2: Batch Upload (Multiple Assets)**

**Goal**: Test concurrent upload handling

**Preparation**:
1. Create script with 3 scenes
2. Generate assets:
   - Scene 1: 1 image
   - Scene 2: 1 video (nếu có)
   - Scene 3: 1 image + 1 audio

**Steps**:
1. Gallery → Click **"Chọn tài sản"**
2. Select **5-10 assets** (mix of images/videos/audios)
3. Click **"Upload to CapCut (X)"**
4. Modal shows all selected assets
5. Click **"Start Upload"**
6. **Expected**:
   - Assets upload **sequentially** (one at a time)
   - Overall progress bar: 0% → 100%
   - Each asset shows individual progress
   - No UI freeze/lag

**Monitor**:
- Upload speed: Should be ~2-5 seconds per asset (depending on size)
- Memory usage: Should not spike dramatically

**Success Criteria**:
- ✅ All assets reach "Success" status
- ✅ Summary shows: "X Successful, 0 Failed"
- ✅ Download report includes all paths

---

### **Test 3: Server Offline Detection**

**Goal**: Test connection error handling

**Steps**:
1. **STOP CapCut server**: Press `Ctrl+C` in server terminal
2. Gallery → Select 1 asset
3. Click **"Upload to CapCut (1)"**
4. **Expected**:
   - Red alert: "CapCut server is not running..."
   - "Start Upload" button **disabled**
   - No uploads attempted
5. **START CapCut server again**
6. Wait 2-3 seconds (health check runs)
7. **Expected**:
   - Red alert disappears
   - "Start Upload" button enabled

**Success Criteria**:
- ✅ Clear error message when server offline
- ✅ Auto-detects when server comes back online

---

### **Test 4: Upload Cancellation**

**Goal**: Test abort functionality

**Steps**:
1. Select **10 assets**
2. Click "Upload to CapCut"
3. Click "Start Upload"
4. Wait until 3-4 assets uploaded (watch overall progress ~30-40%)
5. Click **"Cancel Upload"** button
6. **Expected**:
   - Upload stops immediately
   - Remaining assets stay in "Pending" state
   - Already uploaded assets show "Success"
   - Summary shows: "X Successful, Y Pending"

**Success Criteria**:
- ✅ Cancel works immediately
- ✅ No errors in console
- ✅ Partial results preserved

---

### **Test 5: Error Handling (Large File)**

**Goal**: Test file size validation

**Note**: Backend has 500MB limit (see `upload_handler.py` line 13)

**Steps**:
1. (Optional) Generate very large video (>100MB)
   - Or use existing large file
2. Select large asset
3. Upload to CapCut
4. **Expected**:
   - If >500MB: Error message "File too large..."
   - If <500MB but slow: Shows progress correctly

**Success Criteria**:
- ✅ Large files handled gracefully
- ✅ Progress bar updates smoothly

---

### **Test 6: Mixed Asset Types**

**Goal**: Verify all asset types upload correctly

**Steps**:
1. Select assets:
   - 2 images (PNG/JPG)
   - 1 video (MP4)
   - 2 audios (MP3)
2. Upload to CapCut
3. Click "Download Report" after completion
4. **Verify report JSON**:
   ```json
   {
     "results": [
       {
         "assetType": "image",
         "status": "success",
         "localPath": "d:\\Repository\\capcut-api\\uploads\\image\\abc123.png"
       },
       {
         "assetType": "video",
         "status": "success",
         "localPath": "d:\\Repository\\capcut-api\\uploads\\video\\def456.mp4"
       },
       {
         "assetType": "audio",
         "status": "success",
         "localPath": "d:\\Repository\\capcut-api\\uploads\\audio\\ghi789.mp3"
       }
     ]
   }
   ```

**Success Criteria**:
- ✅ All asset types upload successfully
- ✅ Correct file extensions preserved
- ✅ Paths categorized by type (image/video/audio folders)

---

### **Test 7: UI/UX Verification**

**Goal**: Check user experience quality

**Checklist**:
- [ ] Selection mode clearly indicated (checkboxes visible)
- [ ] Upload button shows selected count: "Upload to CapCut (X)"
- [ ] Modal opens smoothly (no flicker)
- [ ] Progress bars animate smoothly (no jumps)
- [ ] Success/error icons clear (green check / red X)
- [ ] Local paths readable (not truncated)
- [ ] Modal scrollable if many assets
- [ ] Close button works at all stages
- [ ] Download report button appears only after completion

---

## 📊 **Performance Benchmarks**

| Metric | Target | Actual |
|--------|--------|--------|
| Upload 1 image (2MB) | <3s | ___s |
| Upload 10 images | <30s | ___s |
| Upload 1 video (50MB) | <15s | ___s |
| Server health check | <500ms | ___ms |
| Modal open time | <200ms | ___ms |
| Memory increase (10 uploads) | <50MB | ___MB |

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Cannot find name 'Progress'"
**Cause**: Progress component not in UI package
**Solution**: Already fixed - using custom div with CSS animations

### Issue 2: Upload stuck at 0%
**Cause**: CapCut server not running or port blocked
**Solution**:
```bash
# Check server logs
# Verify port 9001 not in use
netstat -ano | findstr :9001
```

### Issue 3: "CORS error"
**Cause**: Browser blocking cross-origin request
**Solution**: CapCut server already has CORS enabled (Flask-CORS)
- If still error, check `capcut_server.py` has `@app.route()` decorators

### Issue 4: Upload modal doesn't open
**Cause**: No assets selected
**Solution**: Must click "Chọn tài sản" first, then select at least 1 asset

---

## ✅ **Test Completion Checklist**

Before marking feature as complete:

- [ ] Test 1: Single upload ✅
- [ ] Test 2: Batch upload (10 assets) ✅
- [ ] Test 3: Server offline detection ✅
- [ ] Test 4: Cancel upload ✅
- [ ] Test 5: Large file handling ✅
- [ ] Test 6: Mixed asset types ✅
- [ ] Test 7: UI/UX verification ✅
- [ ] Performance benchmarks recorded
- [ ] No console errors during all tests
- [ ] Backend files verified (`uploads/` folder)

---

## 🎯 **Success Metrics**

**Pass Criteria**:
- All 7 test cases pass without errors
- Performance within benchmarks
- UI responsive and clear
- Error messages helpful

**Failure Triggers**:
- Any test case fails >3 times
- Server crashes during upload
- Memory leak (>100MB increase)
- UI freeze >1 second

---

## 📝 **Report Template**

After testing, fill this report:

```markdown
# Gallery Upload Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: Windows/Mac/Linux, Chrome Version

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1: Basic Upload | ✅/❌ | ... |
| Test 2: Batch Upload | ✅/❌ | ... |
| Test 3: Server Offline | ✅/❌ | ... |
| Test 4: Cancel Upload | ✅/❌ | ... |
| Test 5: Large File | ✅/❌ | ... |
| Test 6: Mixed Types | ✅/❌ | ... |
| Test 7: UI/UX | ✅/❌ | ... |

## Performance

- Upload 1 image (2MB): ___s
- Upload 10 images: ___s
- Memory usage: ___MB

## Issues Found

1. [Issue description]
2. ...

## Recommendations

1. [Improvement suggestion]
2. ...
```

---

## 🔗 **Next Steps After Testing**

1. ✅ If all tests pass → Proceed to **Full Export Test** (see `CAPCUT_TESTING_GUIDE.md`)
2. ❌ If tests fail → Review logs, fix issues, re-test
3. 📊 Performance issues → Profile with Chrome DevTools
4. 🐛 Bugs found → Create GitHub issues with test report

---

**Happy Testing! 🚀**
