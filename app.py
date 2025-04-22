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

@app.route("/proxy/books", methods=["GET"])
def proxy_books():
    # Proxy request to Django backend
    backend_url = "http://192.168.100.63:8000/library/books/"
    params = request.args.to_dict()
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    # Pass Authorization header if present
    if "Authorization" in request.headers:
        headers["Authorization"] = request.headers["Authorization"]

    try:
        response = requests.get(backend_url, params=params, headers=headers)
        response.raise_for_status()
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, 500
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)