from flask import Flask, send_from_directory, redirect
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return redirect('/acceuil/acceuil.html')

# Route pour l'application Formulama (Vite build)
@app.route('/app')
@app.route('/app/')
def formulama_app():
    return send_from_directory('formulama_vite/dist', 'index.html')

# Routes pour les assets Vite (priorité haute)
@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory('formulama_vite/dist/assets', path)

@app.route('/favicon.ico')
def serve_favicon():
    try:
        return send_from_directory('formulama_vite/dist', 'favicon.ico')
    except:
        return '', 204

@app.route('/app/<path:path>')
def formulama_app_files(path):
    # If the requested file exists in the dist folder serve it, otherwise
    # return index.html so the client-side router can handle the route.
    dist_dir = os.path.join('formulama_vite', 'dist')
    full_path = os.path.join(dist_dir, path)
    if os.path.exists(full_path) and not os.path.isdir(full_path):
        return send_from_directory(dist_dir, path)
    return send_from_directory(dist_dir, 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
