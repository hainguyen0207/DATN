import json
import os
import time
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from cve_search_exploit.exploit_scanner import CVESearch
from cve_scanner.cve_scanner import CVEScanner
from pathtraversal_scanner.pathtraversal_scanner import PathTraversalScanner
from sqli_scanner.sqli_scanner import SQLiScanner
from xss_scanner.xss_scanner import XSSScanner

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER_PATH_TRAVERSAL'] = './pathtraversal_scanner/uploads'
app.config['LOG_FOLDER_PATH_TRAVERSAL'] = './pathtraversal_scanner/logs'
os.makedirs(app.config['UPLOAD_FOLDER_PATH_TRAVERSAL'], exist_ok=True)
os.makedirs(app.config['LOG_FOLDER_PATH_TRAVERSAL'], exist_ok=True)

app.config['UPLOAD_FOLDER_SQLI'] = './sqli_scanner/uploads'
app.config['LOG_FOLDER_SQLI'] = './sqli_scanner/logs'
os.makedirs(app.config['UPLOAD_FOLDER_SQLI'], exist_ok=True)
os.makedirs(app.config['LOG_FOLDER_SQLI'], exist_ok=True)

app.config['UPLOAD_FOLDER_XSS'] = './xss_scanner/uploads'
app.config['LOG_FOLDER_XSS'] = './xss_scanner/logs'
os.makedirs(app.config['UPLOAD_FOLDER_XSS'], exist_ok=True)
os.makedirs(app.config['LOG_FOLDER_XSS'], exist_ok=True)


@app.route('/')
def index():
    return render_template('index.html')


# chức năng tìm kiếm cve
@app.route('/cve-search', methods=['POST'])
def cve_search():
    scanner = CVESearch()
    cve = request.form['cve']
    local_results = scanner.search_local_exploit(cve)
    github_results = scanner.search_github_exploit(cve)

    return jsonify({
        "cve": cve,
        "local_results": local_results,
        "github_results": github_results
    })


# chức năng scan cve
@app.route('/cve-scan', methods=['POST'])
def cve_scan():
    target = request.form.get('target')
    if not target:
        return jsonify({"message": "Target is required"}), 400

    scanner = CVEScanner(target)
    # results = scanner.start_scan()

    # tạo kết quả giả
    results = """
       [
           {"service_name": "ftp", "service_version": "2.3.4", "cves": ["CVE-2011-0762", "CVE-2011-2523"]},
           {"service_name": "domain", "service_version": "9.4.2", "cves": ["CVE-2008-0122", "CVE-2012-3817", "CVE-2008-4163"]},
           {"service_name": "http", "service_version": "2.2.8", "cves": ["CVE-2008-0005", "CVE-2007-6420", "CVE-2024-40898"]},
           {"service_name": "postgresql", "service_version": "8.3.0 - 8.3.7", "cves": ["CVE-2010-1975", "CVE-2012-3489", "CVE-2009-4136"]},
           {"service_name": "http", "service_version": "1.1", "cves": ["CVE-2023-26044", "CVE-2008-3844", "CVE-2015-5600"]},
           {"service_name": "drb", "service_version": "", "cves": ["CVE-2008-1447", "CVE-2008-4310", "CVE-2008-2663"]}
       ]
    """
    if not results:
        return jsonify({"message": "No CVEs found for the target", "results": []}), 200

    return jsonify({
        "message": f"CVE scan results for target: {target}",
        "results": json.loads(results)
    }), 200


# Chức năng pathtraversal-scanner
@app.route('/path-traversal-scanner', methods=['POST'])
def path_traversal_scanner():
    request_file = request.files.get('request_file')
    payload_file = request.files.get('payload_file')
    params_to_scan = request.form.get('params_to_scan', '').split(',')
    download_log = request.form.get('download_log') == 'true'

    if request_file:
        request_file.save(os.path.join(app.config['UPLOAD_FOLDER_PATH_TRAVERSAL'], "request.txt"))
        if payload_file:
            payload_file.save(os.path.join(app.config['UPLOAD_FOLDER_PATH_TRAVERSAL'], "payloads.txt"))
            payload_path = os.path.join(app.config['UPLOAD_FOLDER_PATH_TRAVERSAL'], "payloads.txt")
        else:
            payload_path = None

        scanner = PathTraversalScanner(
            request_file=os.path.join(app.config['UPLOAD_FOLDER_PATH_TRAVERSAL'], "request.txt"),
            payload_file=payload_path,
            params_to_scan=params_to_scan,
            log_file=os.path.join(app.config['LOG_FOLDER_PATH_TRAVERSAL'], "path_traversal_log.json")
        )
        result = scanner.run()

        response = {"result": result}
        if download_log:
            response["log_path"] = os.path.join(app.config['LOG_FOLDER_PATH_TRAVERSAL'], "path_traversal_log.json")

        return jsonify(response)
    return jsonify({"message": "Error: Request file is required"}), 400


@app.route('/log-path-traversal-scanner', methods=['GET'])
def download_log_path_traversal():
    log_filename = "path_traversal_log.json"
    log_path = os.path.join(app.config['LOG_FOLDER_PATH_TRAVERSAL'], log_filename)
    if os.path.exists(log_path):
        return send_from_directory(app.config['LOG_FOLDER_PATH_TRAVERSAL'], log_filename, as_attachment=True)
    else:
        return jsonify({"error": "Log file not found"}), 404


# Chức năng SQLI Scanner
@app.route('/sqli-scanner', methods=['POST'])
def sqli_scanner():
    request_file = request.files['request_file']
    params_to_scan = request.form.get('params_to_scan', '').split(',')
    download_log = request.form.get('download_log') == 'true'

    request_path = os.path.join(app.config['UPLOAD_FOLDER_SQLI'], request_file.filename)
    request_file.save(request_path)

    scanner = SQLiScanner(request_path, params_to_scan=params_to_scan,
                          log_file=os.path.join(app.config['LOG_FOLDER_SQLI'], 'sqli_log.json'))
    scan_result = scanner.run()

    response_data = {
        "result": {
            "message": "Scan completed",
            "log_path": os.path.join(app.config['LOG_FOLDER_SQLI'], 'sqli_log.json') if download_log else None,
            "request_details": scan_result.get("request_details", {}),
            "results": scan_result.get("scan_results", [])
        }
    }
    return jsonify(response_data)


@app.route('/log-sqli-scanner', methods=['GET'])
def download_log_sqli_scanner():
    log_path = os.path.join(app.config['LOG_FOLDER_SQLI'], 'sqli_log.json')
    if os.path.exists(log_path):
        return send_file(log_path, as_attachment=True)
    else:
        return "Log file not found", 404


# chức năng xss scanner
@app.route('/xss-scanner', methods=['POST'])
def xss_scanner():
    request_file = request.files['request_file']
    params_to_scan = request.form.get('params_to_scan').split(',') if request.form.get('params_to_scan') else None
    blind_file = request.files.get('blind_file')
    payload_file = request.files.get('payload_file')
    download_log = request.form.get('download_log') == 'true'

    request_file_path = os.path.join(app.config['UPLOAD_FOLDER_XSS'], request_file.filename)
    request_file.save(request_file_path)

    blind_file_path = None
    if blind_file:
        blind_file_path = os.path.join(app.config['UPLOAD_FOLDER_XSS'], blind_file.filename)
        blind_file.save(blind_file_path)

    payload_file_path = None
    if payload_file:
        payload_file_path = os.path.join(app.config['UPLOAD_FOLDER_XSS'], payload_file.filename)
        payload_file.save(payload_file_path)

    log_path = os.path.join(app.config['LOG_FOLDER_XSS'], 'xss_log.json')

    scanner = XSSScanner(
        request_file=request_file_path,
        params_to_scan=params_to_scan,
        payload_file=payload_file_path,
        log_file=log_path
    )

    start_time = time.time()
    scan_result = scanner.start_scan(detection_request_file=blind_file_path)
    end_time = time.time()

    return jsonify({
        "message": "Scan completed",
        "duration": f"{end_time - start_time:.2f} seconds",
        "result": scan_result,
        "log_path": os.path.exists(log_path) if download_log else None
    })


@app.route('/log-xss-scanner', methods=['GET'])
def download_log_xss_scanner():
    log_path = os.path.join(app.config['LOG_FOLDER_XSS'], 'xss_log.json')
    if os.path.exists(log_path):
        return send_file(log_path, as_attachment=True)
    else:
        return jsonify({"error": "Log file not found"}), 404


if __name__ == '__main__':
    app.run(debug=True, port=2727)
