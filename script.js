let currentQRDataUrl = null;

// 產生 QR 碼
function generateQR() {
    const text = document.getElementById('urlInput').value.trim();
    if (!text) {
        alert('請輸入網址或文字！');
        return;
    }
    const qrResult = document.getElementById('qrResult');
    const qrCanvas = document.getElementById('qrCanvas');
    const ctx = qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

    // 產生 QR 碼到隱藏 div
    const hiddenDiv = document.getElementById('hiddenQRDiv');
    hiddenDiv.innerHTML = '';
    new QRCode(hiddenDiv, {
        text: text,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H
    });

    // 等待 img 載入後再畫到 canvas
    setTimeout(() => {
        const img = hiddenDiv.querySelector('img');
        if (img) {
            const image = new window.Image();
            image.onload = function() {
                qrCanvas.width = image.width;
                qrCanvas.height = image.height;
                ctx.drawImage(image, 0, 0);
                qrResult.style.display = 'block';
                currentQRDataUrl = qrCanvas.toDataURL('image/png');
            };
            image.src = img.src;
            if (img.complete) image.onload();
        } else {
            alert('產生 QR 碼失敗，請重試！');
        }
    }, 100);
}

// 下載 QR 碼
function downloadQR() {
    if (!currentQRDataUrl) {
        alert('請先生成 QR 碼！');
        return;
    }
    const link = document.createElement('a');
    link.href = currentQRDataUrl;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 清除 QR 碼
function clearQR() {
    document.getElementById('urlInput').value = '';
    document.getElementById('qrResult').style.display = 'none';
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentQRDataUrl = null;
}

// 解析 QR 碼
async function decodeQRFromFile(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const codeReader = new ZXing.BrowserQRCodeReader();
            const img = new Image();
            img.onload = async function() {
                try {
                    const result = await codeReader.decodeFromImageElement(img);
                    document.getElementById('decodedText').value = result.text;
                    document.getElementById('decodeResult').style.display = 'block';
                } catch (err) {
                    // zxing-js 失敗，改用 jsQR
                    try {
                        // 建立 canvas 並畫上圖片
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const jsqrResult = jsQR(imageData.data, canvas.width, canvas.height);
                        if (jsqrResult) {
                            document.getElementById('decodedText').value = jsqrResult.data;
                            document.getElementById('decodeResult').style.display = 'block';
                        } else {
                            alert('解析失敗或未偵測到 QR 碼！（zxing-js、jsQR皆失敗）');
                        }
                    } catch (jsqrErr) {
                        alert('解析失敗或未偵測到 QR 碼！（zxing-js、jsQR皆失敗）');
                    }
                }
            };
            img.src = e.target.result;
        } catch (error) {
            alert('解析 QR 碼時發生錯誤：' + error);
        }
    };
    reader.readAsDataURL(file);
}

document.getElementById('qrFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    decodeQRFromFile(file);
});

document.getElementById('pasteFromClipboardBtn').addEventListener('click', async function() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    const blob = await item.getType(type);
                    decodeQRFromFile(blob);
                    return;
                }
            }
        }
        alert('剪貼簿中沒有圖片！');
    } catch (error) {
        alert('讀取剪貼簿時發生錯誤：' + error);
    }
});

function copyDecodedText() {
    const decodedText = document.getElementById('decodedText');
    if (!decodedText.value) {
        alert('沒有可複製的內容！');
        return;
    }
    decodedText.select();
    document.execCommand('copy');
    alert('已複製到剪貼簿！');
} 