import random
import nmap
import requests
import re
from bs4 import BeautifulSoup


class CVEScanner:
    def __init__(self, target):
        self.target = target
        self.file_user_agents = "./cve_scanner/user_agents/user_agents.txt"
        self.USER_AGENTS = self.load_user_agents()

    def scan(self):

        try:
            nm = nmap.PortScanner()
            nm.scan(self.target, arguments='-p- -sV -T4')
            if self.target in nm.all_hosts():
                print("Scan nmap done")
                return nm[self.target]['tcp']
            else:
                print(f"[!] No open ports found on target {self.target}.")
                return {}
        except nmap.PortScannerError as e:
            print(f"[!] Nmap error: {e}")
            return {}
        except Exception as e:
            print(f"[!] Unexpected error during scan: {e}")
            return {}

    def fix_cpe_format(self, cpe):
        cpe_pattern = r'cpe:\/([aho]):([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+):(.+)'
        match = re.match(cpe_pattern, cpe)
        if match:
            cpe_type = match.group(1)
            vendor = match.group(2)
            product = match.group(3)
            version = match.group(4)
            fixed_cpe = f"cpe:2.3:{cpe_type}:{vendor}:{product}:{version}"
            return fixed_cpe
        return None

    def detect_cves(self, service_ports):
        results = []
        for port, service_info in service_ports.items():
            if 'cpe' in service_info:
                cpe = service_info['cpe']
                fixed_cpe = self.fix_cpe_format(cpe)
                if fixed_cpe:
                    cve_list = self.detect_cves_for_cpe(fixed_cpe)
                    if cve_list:
                        service_name = service_info.get('name', 'N/A')
                        service_version = service_info.get('version', 'N/A')
                        results.append({
                            "service_name": service_name,
                            "service_version": service_version,
                            "cves": cve_list
                        })
        return results

    def detect_cves_for_cpe(self, cpe):
        cve_list = []
        service_name, version = cpe.split(":")[4], cpe.split(":")[5]
        google_cve_list = self.search_cve_google(service_name, version)
        opencve_list = self.search_cve_opencve(service_name, version)

        combined_cve_list = list(set(cve_list + google_cve_list + opencve_list))
        return combined_cve_list

    def query_nvd_api(self, cpe):
        headers = {"User-Agent": random.choice(self.USER_AGENTS)}
        cve_database_url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cpeName={cpe}"
        print("haido")
        try:
            response = requests.get(cve_database_url, headers=headers, timeout=10)
            response.raise_for_status()
            cve_data = response.json()
            cve_list = []
            if 'vulnerabilities' in cve_data:
                for entry in cve_data['vulnerabilities']:
                    cve_id = entry.get('cve', {}).get('id', None)
                    if cve_id:
                        cve_list.append(cve_id)
            return cve_list
        except requests.exceptions.RequestException as e:
            print(f"[!] Error querying NVD API: {e}")
            return []

    def load_user_agents(self):
        try:
            with open(self.file_user_agents, 'r') as file:
                payloads = [line.strip() for line in file if line.strip()]
                if not payloads:
                    print("[!] User agents file is empty.")
                return payloads
        except FileNotFoundError:
            print("[!] User agents file not found.")
            return []
        except Exception as e:
            print(f"[!] Error loading user agents file: {str(e)}")
            return []

    def search_cve_google(self, service_name, version):
        query = f"cve {service_name} {version}"
        url = f"https://www.google.com/search?q={query}"
        headers = {"User-Agent": random.choice(self.USER_AGENTS)}

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            cve_results = re.findall(r"CVE-\d{4}-\d{4,7}", response.text)
            unique_cve_results = list(set(cve_results))  # Loại bỏ các CVE trùng lặp
            return unique_cve_results
        except requests.exceptions.RequestException as e:
            print(f"[!] Error querying Google: {e}")
            return []

    def search_cve_opencve(self, service_name, version):
        query = f"{service_name} {version}"
        url = f"https://www.opencve.io/cve?search={query}"
        headers = {"User-Agent": random.choice(self.USER_AGENTS)}

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            cve_results = re.findall(r"CVE-\d{4}-\d{4,7}", response.text)
            unique_cve_results = list(set(cve_results))
            return unique_cve_results
        except requests.exceptions.RequestException as e:
            print(f"[!] Error querying OpenCVE: {e}")
            return []

    def start_scan(self):

        service_ports = self.scan()
        if not service_ports:
            return {"message": f"No open ports found on {self.target}", "results": []}

        results = self.detect_cves(service_ports)
        print(results)
        return {"target": self.target, "results": results}


if __name__ == '__main__':
    print(CVEScanner("192.168.30.155").start_scan())
