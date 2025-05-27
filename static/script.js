let currentQRImage = null;

async function generateQR() {
    const url = document.getElementById('urlInput').value.trim();
    if (!url) {
        alert('請輸入網址！');
        return;
    }

    try {
        console.log('開始產生 QR 碼...');
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });

        console.log('收到回應:', response.status);
        const data = await response.json();
        console.log('回應數據:', data);

        if (data.error) {
            alert(data.error);
            return;
        }

        const qrResult = document.getElementById('qrResult');
        const qrImage = document.getElementById('qrImage');
        qrImage.src = 'data:image/png;base64,' + data.image;
        currentQRImage = data.image;
        qrResult.style.display = 'block';
        console.log('QR 碼產生成功');
    } catch (error) {
        console.error('錯誤詳情:', error);
        alert('產生 QR 碼時發生錯誤：' + error);
    }
}

function downloadQR() {
    if (!currentQRImage) {
        alert('請先生成 QR 碼！');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.href = 'data:image/png;base64,' + currentQRImage;
        link.download = 'qrcode.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('QR 碼下載成功');
    } catch (error) {
        console.error('下載錯誤:', error);
        alert('下載 QR 碼時發生錯誤：' + error);
    }
}

document.getElementById('qrFile').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            console.log('開始解析 QR 碼...');
            const response = await fetch('/decode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: e.target.result })
            });

            console.log('收到回應:', response.status);
            const data = await response.json();
            console.log('回應數據:', data);

            if (data.error) {
                alert(data.error);
                return;
            }

            const decodeResult = document.getElementById('decodeResult');
            const decodedText = document.getElementById('decodedText');
            decodedText.value = data.data;
            decodeResult.style.display = 'block';
            console.log('QR 碼解析成功');
        } catch (error) {
            console.error('錯誤詳情:', error);
            alert('解析 QR 碼時發生錯誤：' + error);
        }
    };
    reader.readAsDataURL(file);
});

function copyDecodedText() {
    const decodedText = document.getElementById('decodedText');
    if (!decodedText.value) {
        alert('沒有可複製的內容！');
        return;
    }
    
    try {
        decodedText.select();
        document.execCommand('copy');
        alert('已複製到剪貼簿！');
        console.log('內容複製成功');
    } catch (error) {
        console.error('複製錯誤:', error);
        alert('複製時發生錯誤：' + error);
    }
}

document.getElementById('pasteFromClipboardBtn').addEventListener('click', async function() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    const blob = await item.getType(type);
                    const reader = new FileReader();
                    reader.onload = async function(e) {
                        // 與檔案上傳解析流程相同
                        try {
                            const response = await fetch('/decode', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ image: e.target.result })
                            });
                            const data = await response.json();
                            if (data.error) {
                                alert(data.error);
                                return;
                            }
                            const decodeResult = document.getElementById('decodeResult');
                            const decodedText = document.getElementById('decodedText');
                            decodedText.value = data.data;
                            decodeResult.style.display = 'block';
                        } catch (error) {
                            alert('解析 QR 碼時發生錯誤：' + error);
                        }
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }
        alert('剪貼簿中沒有圖片！');
    } catch (error) {
        alert('讀取剪貼簿時發生錯誤：' + error);
    }
});

function clearQR() {
    document.getElementById('urlInput').value = '';
    document.getElementById('qrResult').style.display = 'none';
    currentQRImage = null;
} 