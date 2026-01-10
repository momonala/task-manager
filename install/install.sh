service_name="task-manager"
backup_service_name="${service_name}-data-backup-scheduler"
service_port="5010"

set -e  # Exit immediately if a command exits with a non-zero status

echo "✅ Installing uv (Python package manager)"
if ! command -v uv &> /dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
else
    echo "✅ uv is already installed. Updating to latest version."
    uv self update
fi

echo "✅ Installing project dependencies with uv"
uv sync

echo "✅ Copying service file to systemd directory"
sudo cp install/projects_${service_name}.service /lib/systemd/system/projects_${service_name}.service
sudo cp install/projects_${backup_service_name}.service /lib/systemd/system/projects_${backup_service_name}.service

echo "✅ Setting permissions for the service file"
sudo chmod 644 /lib/systemd/system/projects_${service_name}.service
sudo chmod 644 /lib/systemd/system/projects_${backup_service_name}.service

echo "✅ Reloading systemd daemon"
sudo systemctl daemon-reload
sudo systemctl daemon-reexec

echo "✅ Enabling the service: projects_${service_name}.service"
sudo systemctl enable projects_${service_name}.service
sudo systemctl enable projects_${backup_service_name}.service
sudo systemctl restart projects_${service_name}.service
sudo systemctl restart projects_${backup_service_name}.service
sudo systemctl status projects_${service_name}.service --no-pager
sudo systemctl status projects_${backup_service_name}.service --no-pager

echo "✅ Adding Cloudflared service"
/home/mnalavadi/add_cloudflared_service.sh ${service_name}.mnalavadi.org $service_port
echo "✅ Configuring Cloudflared DNS route"
cloudflared tunnel route dns raspberrypi-tunnel ${service_name}.mnalavadi.org
echo "✅ Restarting Cloudflared service"
sudo systemctl restart cloudflared

echo "✅ Setup completed successfully! 🎉"
