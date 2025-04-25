from flask import Flask, render_template, request, redirect, url_for
import requests

app = Flask(__name__)

@app.route("/signup")
def signup():
    return render_template("signup.html")

@app.route("/verify")
def verify():
    email = request.args.get("email")
    return render_template("verify.html", email=email or "")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/logout")
def logout():
    return redirect(url_for("home"))

@app.route("/details")
def details():
    return render_template("details.html")

@app.route("/proxy/books", methods=["GET"])
def proxy_books():
    backend_url = "http://192.168.100.63:8000/library/books/"
    params = request.args.to_dict()
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if "Authorization" in request.headers:
        headers["Authorization"] = request.headers["Authorization"]

    try:
        response = requests.get(backend_url, params=params, headers=headers)
        response.raise_for_status()
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500

@app.route("/proxy/books/<int:id>/", methods=["GET"])
def proxy_book_details(id):
    backend_url = f"http://192.168.100.63:8000/library/books/{id}/"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if "Authorization" in request.headers:
        headers["Authorization"] = request.headers["Authorization"]

    try:
        response = requests.get(backend_url, headers=headers)
        response.raise_for_status()
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500

@app.route("/proxy/books/<int:id>/comments/", methods=["POST"])
def proxy_book_comments(id):
    backend_url = f"http://192.168.100.63:8000/library/books/{id}/comments/"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if "Authorization" in request.headers:
        headers["Authorization"] = request.headers["Authorization"]

    try:
        data = request.get_json()
        response = requests.post(backend_url, json=data, headers=headers)
        response.raise_for_status()
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500

@app.route("/proxy/comments/create/", methods=["POST"])
def proxy_comments_create():
    backend_url = "http://192.168.100.63:8000/library/comments/create/"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if "Authorization" in request.headers:
        headers["Authorization"] = request.headers["Authorization"]

    try:
        data = request.get_json()
        response = requests.post(backend_url, json=data, headers=headers)
        response.raise_for_status()
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500

@app.route("/proxy/books/<int:id>/likes/", methods=["POST"])
def proxy_book_likes(id):
    backend_url = f"http://192.168.100.63:8000/library/books/{id}/likes/"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if "Authorization" in request.headers:
        headers["Authorization"] = request.headers["Authorization"]

    try:
        data = request.get_json()
        response = requests.post(backend_url, json=data, headers=headers)
        response.raise_for_status()
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)