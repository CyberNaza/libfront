from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/proxy/books')
def proxy_books():
    try:
        params = request.args  # Forward query parameters (page, page_size, search)
        response = requests.get('http://192.168.100.63/library/books/', params=params)
        response.raise_for_status()  # Raise exception for non-200 status
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)