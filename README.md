# PNG Resize 批次處理工具

一個支援透明底PNG圖片的批次處理工具，可自動將圖片調整為1024x1024尺寸。

## 功能特色

- 批次處理最多100張PNG圖片
- 支援透明底PNG，自動保留透明度
- 智能縮放：根據最長邊等比例縮放
- 畫布擴展：自動擴展為1024x1024
- 直接存檔：選擇輸出資料夾後自動儲存，無需手動下載
- 拖拽上傳：支援拖拽檔案操作
- 即時進度：顯示處理進度和狀態

## 處理規則

1. **縮放邏輯**：
   - 判斷圖片最長邊（寬或高）
   - 以最長邊為基準等比例縮放至1024px
   - 保持圖像比例，不變形

2. **畫布擴展**：
   - 將縮放後的圖片置中
   - 擴展畫布為1024x1024

3. **背景處理**：
   - 透明底PNG → 輸出透明底PNG
   - 有底色PNG → 輸出黑色底PNG

4. **畫質保證**：
   - 不壓縮畫質
   - 保持原始圖像內容比例

## 使用方法

### 線上使用

訪問 GitHub Pages：[https://greed0513.github.io/LoraResize](https://greed0513.github.io/LoraResize)

### 本地使用

1. 下載或克隆此倉庫
2. 使用 **Chrome** 或 **Edge** 瀏覽器開啟 `index.html`
3. 點擊「📂 選擇輸出資料夾」選擇存檔位置
4. 拖拽或點擊上傳PNG圖片（最多100張）
5. 點擊「開始處理」
6. 處理完成的圖片會自動儲存到指定資料夾

## 瀏覽器支援

| 瀏覽器 | 支援直接存檔 | 備註 |
|--------|------------|------|
| Chrome | ✅ | 完整支援 |
| Edge | ✅ | 完整支援 |
| Safari | ❌ | 降級為下載模式 |
| Firefox | ❌ | 降級為下載模式 |

**注意**：需要瀏覽器支援 [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) 才能使用直接存檔功能。

## 技術架構

- **HTML5**: 結構化網頁
- **CSS3**: 響應式設計，漸層視覺效果
- **JavaScript (ES6+)**:
  - Canvas API 進行圖片處理
  - File System Access API 實現直接存檔
  - Drag & Drop API 支援拖拽上傳

## 檔案結構

```
LoraResize/
├── index.html      # 主頁面
├── style.css       # 樣式表
├── script.js       # 核心邏輯
└── README.md       # 說明文件
```

## 輸出格式

- 檔名格式：`原始檔名_1024x1024.png`
- 圖片尺寸：1024 x 1024 像素
- 檔案格式：PNG（保留透明度）

## 授權

MIT License

## 問題回報

如有問題或建議，請在 [Issues](https://github.com/your-username/LoraResize/issues) 頁面提出。
