#!/bin/bash

# ==============================================================================
# CS-Construction Docker Stack - Automated Backup Script
# ==============================================================================
# Backs up all critical data from the Docker stack
# Recommended: Run daily via cron at 2 AM
#
# Installation:
#   chmod +x backup.sh
#   sudo crontab -e
#   Add: 0 2 * * * /opt/cdhi-stack/backup.sh >> /var/log/cdhi-backup.log 2>&1
# ==============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Backup destination directory
BACKUP_DIR="${BACKUP_DIR:-/backup/cdhi}"

# Docker Compose project directory
DOCKER_DIR="$(cd "$(dirname "$0")" && pwd)"

# Date stamp for backup files
DATE=$(date +%Y%m%d_%H%M%S)

# Retention policy (days)
RETENTION_DAYS=14

# Load environment variables
if [ -f "$DOCKER_DIR/.env" ]; then
    source "$DOCKER_DIR/.env"
else
    echo "ERROR: .env file not found in $DOCKER_DIR"
    exit 1
fi

# ==============================================================================
# FUNCTIONS
# ==============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Backup MariaDB database
backup_mariadb() {
    log "Starting MariaDB backup..."

    local backup_file="$BACKUP_DIR/mariadb_$DATE.sql"

    cd "$DOCKER_DIR"
    docker-compose exec -T mariadb mysqldump \
        -u root \
        -p"$DB_ROOT_PASSWORD" \
        --all-databases \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --routines \
        --triggers \
        --events \
        > "$backup_file"

    if [ $? -eq 0 ]; then
        # Compress the dump
        gzip "$backup_file"
        log "MariaDB backup completed: ${backup_file}.gz ($(du -h "${backup_file}.gz" | cut -f1))"
    else
        error "MariaDB backup failed"
        return 1
    fi
}

# Backup Invoice Ninja storage volume
backup_invoiceninja_storage() {
    log "Starting Invoice Ninja storage backup..."

    local backup_file="$BACKUP_DIR/invoiceninja_storage_$DATE.tar.gz"
    local volume_path=$(docker volume inspect cdhi-stack_invoiceninja_storage --format '{{ .Mountpoint }}' 2>/dev/null)

    if [ -n "$volume_path" ] && [ -d "$volume_path" ]; then
        tar -czf "$backup_file" -C "$volume_path" .
        if [ $? -eq 0 ]; then
            log "Invoice Ninja storage backup completed: $backup_file ($(du -h "$backup_file" | cut -f1))"
        else
            error "Invoice Ninja storage backup failed"
            return 1
        fi
    else
        error "Invoice Ninja storage volume not found"
        return 1
    fi
}

# Backup n8n workflows and data
backup_n8n() {
    log "Starting n8n backup..."

    local backup_file="$BACKUP_DIR/n8n_data_$DATE.tar.gz"
    local volume_path=$(docker volume inspect cdhi-stack_n8n_data --format '{{ .Mountpoint }}' 2>/dev/null)

    if [ -n "$volume_path" ] && [ -d "$volume_path" ]; then
        tar -czf "$backup_file" -C "$volume_path" .
        if [ $? -eq 0 ]; then
            log "n8n data backup completed: $backup_file ($(du -h "$backup_file" | cut -f1))"
        else
            error "n8n backup failed"
            return 1
        fi
    else
        error "n8n data volume not found"
        return 1
    fi

    # Export workflows via API (if n8n is running)
    local workflows_file="$BACKUP_DIR/n8n_workflows_$DATE.json"
    cd "$DOCKER_DIR"
    if docker-compose ps n8n | grep -q "Up"; then
        log "Exporting n8n workflows via API..."
        docker-compose exec -T n8n n8n export:workflow --all > "$workflows_file" 2>/dev/null || true
        if [ -f "$workflows_file" ] && [ -s "$workflows_file" ]; then
            log "n8n workflows exported: $workflows_file ($(du -h "$workflows_file" | cut -f1))"
        fi
    fi
}

# Backup Uptime Kuma data
backup_uptime_kuma() {
    log "Starting Uptime Kuma backup..."

    local backup_file="$BACKUP_DIR/uptime_kuma_data_$DATE.tar.gz"
    local volume_path=$(docker volume inspect cdhi-stack_uptime_kuma_data --format '{{ .Mountpoint }}' 2>/dev/null)

    if [ -n "$volume_path" ] && [ -d "$volume_path" ]; then
        tar -czf "$backup_file" -C "$volume_path" .
        if [ $? -eq 0 ]; then
            log "Uptime Kuma backup completed: $backup_file ($(du -h "$backup_file" | cut -f1))"
        else
            error "Uptime Kuma backup failed"
            return 1
        fi
    else
        error "Uptime Kuma data volume not found"
        return 1
    fi
}

# Backup Caddy data (certificates)
backup_caddy() {
    log "Starting Caddy backup..."

    local backup_file="$BACKUP_DIR/caddy_data_$DATE.tar.gz"
    local volume_path=$(docker volume inspect cdhi-stack_caddy_data --format '{{ .Mountpoint }}' 2>/dev/null)

    if [ -n "$volume_path" ] && [ -d "$volume_path" ]; then
        tar -czf "$backup_file" -C "$volume_path" .
        if [ $? -eq 0 ]; then
            log "Caddy data backup completed: $backup_file ($(du -h "$backup_file" | cut -f1))"
        else
            error "Caddy backup failed"
            return 1
        fi
    else
        error "Caddy data volume not found"
        return 1
    fi
}

# Backup configuration files
backup_configs() {
    log "Starting configuration files backup..."

    local backup_file="$BACKUP_DIR/configs_$DATE.tar.gz"

    tar -czf "$backup_file" \
        -C "$DOCKER_DIR" \
        docker-compose.yml \
        Caddyfile \
        mariadb-config/ \
        --exclude=".env" \
        2>/dev/null

    if [ $? -eq 0 ]; then
        log "Configuration files backup completed: $backup_file ($(du -h "$backup_file" | cut -f1))"
    else
        error "Configuration files backup failed"
        return 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0

    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" -o -name "*.json" \) -mtime +$RETENTION_DAYS -print0)

    if [ $deleted_count -gt 0 ]; then
        log "Deleted $deleted_count old backup file(s)"
    else
        log "No old backups to delete"
    fi
}

# Calculate total backup size
calculate_backup_size() {
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log "Total backup directory size: $total_size"
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

main() {
    log "========================================"
    log "CS-Construction Backup Started"
    log "========================================"

    create_backup_dir

    # Run all backups
    backup_mariadb
    backup_invoiceninja_storage
    backup_n8n
    backup_uptime_kuma
    backup_caddy
    backup_configs

    # Cleanup old backups
    cleanup_old_backups

    # Show summary
    calculate_backup_size

    log "========================================"
    log "CS-Construction Backup Completed"
    log "========================================"
}

# Run main function
main "$@"

exit 0
