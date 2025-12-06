// 全域變數
let fileQueue = [];
let isProcessing = false;
let outputDirectoryHandle = null;
let isFSAPISupported = false;

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const clearBtn = document.getElementById('clearBtn');
const processBtn = document.getElementById('processBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const folderPath = document.getElementById('folderPath');
const browserWarning = document.getElementById('browserWarning');

// 初始化事件監聽器
function init() {
    // 檢查瀏覽器支援
    checkBrowserSupport();

    // 上傳區域事件
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // 按鈕事件
    clearBtn.addEventListener('click', clearAllFiles);
    processBtn.addEventListener('click', startProcessing);
    selectFolderBtn.addEventListener('click', selectOutputFolder);

    updateUI();
}

// 檢查瀏覽器是否支援 File System Access API
function checkBrowserSupport() {
    if ('showDirectoryPicker' in window) {
        isFSAPISupported = true;
        browserWarning.style.display = 'none';
    } else {
        isFSAPISupported = false;
        browserWarning.style.display = 'block';
        selectFolderBtn.disabled = true;
    }
}

// 選擇輸出資料夾
async function selectOutputFolder() {
    if (!isFSAPISupported) {
        alert('您的瀏覽器不支援此功能，請使用Chrome或Edge瀏覽器！');
        return;
    }

    try {
        const dirHandle = await window.showDirectoryPicker({
            mode: 'readwrite'
        });

        outputDirectoryHandle = dirHandle;
        folderPath.textContent = dirHandle.name;
        folderPath.classList.add('selected');

        updateUI();
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('選擇資料夾時發生錯誤:', error);
            alert('選擇資料夾失敗：' + error.message);
        }
    }
}

// 拖拽相關處理
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// 檔案選擇處理
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
    fileInput.value = '';
}

// 添加檔案到佇列
function addFiles(files) {
    const pngFiles = files.filter(file => file.type === 'image/png');

    if (pngFiles.length === 0) {
        alert('請選擇PNG格式的圖片！');
        return;
    }

    const remainingSlots = 100 - fileQueue.length;

    if (pngFiles.length > remainingSlots) {
        alert(`最多只能添加${remainingSlots}張圖片（目前已有${fileQueue.length}張）`);
        pngFiles.splice(remainingSlots);
    }

    pngFiles.forEach(file => {
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            status: 'pending',
            error: null
        };
        fileQueue.push(fileObj);
    });

    updateUI();
}

// 清除所有檔案
function clearAllFiles() {
    if (isProcessing) {
        alert('處理中無法清除檔案！');
        return;
    }

    fileQueue = [];
    updateUI();
}

// 移除單個檔案
function removeFile(id) {
    if (isProcessing) {
        alert('處理中無法移除檔案！');
        return;
    }

    fileQueue = fileQueue.filter(f => f.id !== id);
    updateUI();
}

// 更新UI
function updateUI() {
    // 更新檔案列表
    fileList.innerHTML = '';

    fileQueue.forEach(fileObj => {
        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${fileObj.status}`;

        const statusText = {
            'pending': '等待中',
            'processing': '處理中...',
            'completed': '已完成 ✓',
            'error': '錯誤 ✗'
        };

        fileItem.innerHTML = `
            <div class="file-header">
                <div class="file-name" title="${fileObj.name}">${fileObj.name}</div>
                ${fileObj.status === 'pending' ? `<button class="file-remove" onclick="removeFile(${fileObj.id})">×</button>` : ''}
            </div>
            <div class="file-info">${formatFileSize(fileObj.size)}</div>
            <div class="file-status ${fileObj.status}">${statusText[fileObj.status]}</div>
            ${fileObj.error ? `<div class="file-info" style="color: #ef5350;">${fileObj.error}</div>` : ''}
        `;

        fileList.appendChild(fileItem);
    });

    // 更新按鈕狀態
    const canProcess = fileQueue.length > 0 && !isProcessing && (isFSAPISupported ? outputDirectoryHandle !== null : true);
    processBtn.disabled = !canProcess;
    clearBtn.disabled = isProcessing;

    // 如果支援FS API但未選擇資料夾，顯示提示
    if (isFSAPISupported && !outputDirectoryHandle && fileQueue.length > 0) {
        processBtn.title = '請先選擇輸出資料夾';
    } else {
        processBtn.title = '';
    }
}

// 格式化檔案大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 開始處理
async function startProcessing() {
    if (fileQueue.length === 0 || isProcessing) return;

    // 如果支援FS API但未選擇資料夾，提示用戶
    if (isFSAPISupported && !outputDirectoryHandle) {
        alert('請先選擇輸出資料夾！');
        return;
    }

    isProcessing = true;
    progressSection.style.display = 'block';

    const totalFiles = fileQueue.length;
    let processedFiles = 0;

    for (let fileObj of fileQueue) {
        if (fileObj.status !== 'pending') continue;

        fileObj.status = 'processing';
        updateUI();

        try {
            await processImage(fileObj);
            fileObj.status = 'completed';
        } catch (error) {
            fileObj.status = 'error';
            fileObj.error = error.message;
            console.error('處理錯誤:', error);
        }

        processedFiles++;
        updateProgress(processedFiles, totalFiles);
        updateUI();
    }

    isProcessing = false;
    updateUI();

    // 顯示完成訊息
    alert(`處理完成！已儲存 ${processedFiles} 張圖片到資料夾：${outputDirectoryHandle.name}`);

    setTimeout(() => {
        progressSection.style.display = 'none';
        progressFill.style.width = '0%';
    }, 2000);
}

// 更新進度
function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = `處理中... ${current}/${total}`;
}

// 處理單張圖片
async function processImage(fileObj) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = async () => {
            try {
                const result = resizeImage(img, fileObj.name);

                if (isFSAPISupported && outputDirectoryHandle) {
                    await saveToFolder(result.canvas, result.filename);
                } else {
                    downloadImage(result.canvas, result.filename);
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('圖片載入失敗'));
        };

        reader.onerror = () => {
            reject(new Error('檔案讀取失敗'));
        };

        reader.readAsDataURL(fileObj.file);
    });
}

// Resize圖片核心邏輯
function resizeImage(img, originalName) {
    const originalWidth = img.width;
    const originalHeight = img.height;

    // 判斷最長邊
    const maxDimension = Math.max(originalWidth, originalHeight);
    const scale = 1024 / maxDimension;

    // 計算縮放後的尺寸
    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);

    // 創建臨時canvas進行縮放
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = scaledWidth;
    tempCanvas.height = scaledHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    // 繪製縮放後的圖片
    tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    // 檢測是否有透明底
    const hasTransparency = checkTransparency(tempCtx, scaledWidth, scaledHeight);

    // 創建最終1024x1024的canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 1024;
    finalCanvas.height = 1024;
    const finalCtx = finalCanvas.getContext('2d');

    // 如果沒有透明底，填充黑色背景
    if (!hasTransparency) {
        finalCtx.fillStyle = '#000000';
        finalCtx.fillRect(0, 0, 1024, 1024);
    }

    // 計算居中位置
    const offsetX = Math.floor((1024 - scaledWidth) / 2);
    const offsetY = Math.floor((1024 - scaledHeight) / 2);

    // 繪製縮放後的圖片到中心
    finalCtx.drawImage(tempCanvas, offsetX, offsetY);

    // 生成新檔名
    const nameWithoutExt = originalName.replace(/\.png$/i, '');
    const newFilename = `${nameWithoutExt}_1024x1024.png`;

    return {
        canvas: finalCanvas,
        filename: newFilename
    };
}

// 檢測圖片是否有透明底
function checkTransparency(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 採樣檢測（檢測部分像素以提高效能）
    const sampleRate = 10;

    for (let i = 0; i < data.length; i += 4 * sampleRate) {
        const alpha = data[i + 3];
        if (alpha < 255) {
            return true;
        }
    }

    return false;
}

// 儲存圖片到選定的資料夾（使用 File System Access API）
async function saveToFolder(canvas, filename) {
    try {
        // 創建檔案
        const fileHandle = await outputDirectoryHandle.getFileHandle(filename, {
            create: true
        });

        // 創建可寫入的串流
        const writable = await fileHandle.createWritable();

        // 將canvas轉為blob並寫入
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });

        await writable.write(blob);
        await writable.close();
    } catch (error) {
        throw new Error('儲存檔案失敗: ' + error.message);
    }
}

// 下載圖片（備用方案，用於不支援FS API的瀏覽器）
function downloadImage(canvas, filename) {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// 初始化應用
init();
