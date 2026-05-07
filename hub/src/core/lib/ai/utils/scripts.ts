/**
 * 📝 OLLAMA DEPLOYMENT PLAYBOOKS & SCRIPTS
 * 
 * Step-by-step guides for installing Ollama on your local Mac or production VPS.
 */

export const INSTALLATION_PLAYBOOK = {
  vps: {
    title: "VPS HostGator - Production Setup Guide",
    steps: [
      "1. Connect to your VPS via SSH: ssh root@108.174.151.98",
      "2. Install Ollama: curl -fsSL https://ollama.com/install.sh",
      "3. Configure systemd to bind to all IPs (0.0.0.0):\n   sudo systemctl edit ollama\n   Add inside [Service]:\n   Environment=\"OLLAMA_HOST=0.0.0.0:11434\"",
      "4. Reload services: sudo systemctl daemon-reload && sudo systemctl restart ollama",
      "5. Load the model: ollama run llama3.2",
      "6. Open port in firewall:\n   sudo firewall-cmd --permanent --add-port=11434/tcp\n   sudo firewall-cmd --reload"
    ]
  },
  docker: {
    title: "Docker High Availability Deployment Compose",
    yaml: `
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama-vps
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_data:/root/.ollama
    restart: unless-stopped
`
  },
  local: {
    title: "Local Mac - Offline Development Setup",
    steps: [
      "1. Download and install Ollama from: https://ollama.com/download/mac",
      "2. Open your terminal and run the local engine: ollama run llama3.2",
      "3. Ensure the local endpoint is alive: curl http://localhost:11434/api/tags"
    ]
  }
};
