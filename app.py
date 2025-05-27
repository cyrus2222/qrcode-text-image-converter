from flask import Flask, render_template, request, jsonify, send_file
import qrcode
from PIL import Image
from pyzbar.pyzbar import decode
import io
import base64
import os

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_qr():
    url = request.json.get('url', '').strip()
    if not url:
        return jsonify({'error': '請輸入網址！'}), 400
    
    try:
        qr = qrcode.QRCode(box_size=8, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')
        
        # 將圖片轉換為 base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'image': img_str
        })
    except Exception as e:
        return jsonify({'error': f'產生QR碼失敗：{str(e)}'}), 500

@app.route('/decode', methods=['POST'])
def decode_qr():
    try:
        # 從 base64 圖片數據中獲取圖片
        image_data = request.json.get('image', '').split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # 解析 QR 碼
        decoded_objs = decode(image)
        if not decoded_objs:
            return jsonify({'error': '未偵測到QR碼！'}), 400
            
        data = decoded_objs[0].data.decode('utf-8')
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({'error': f'解析失敗：{str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True) 