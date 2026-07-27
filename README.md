# webrtcdevelopment-status

Status tracker for the npm package webrtcdevelopment.

## What this repository tracks

- Latest published version
- Publish and modify timestamps
- License
- Repository and homepage URLs
- Dependency list
- Package size and file count
- Maintainer list

## Current snapshot

The latest snapshot is stored in status.json.

Source package: https://www.npmjs.com/package/webrtcdevelopment

## Auto updates

This repository includes a GitHub Actions workflow that runs every day and on manual trigger:

- Runs scripts/update-status.ps1
- Updates status.json
- Commits and pushes changes if there is any diff

## Local update command

From this repository root:

powershell -ExecutionPolicy Bypass -File ./scripts/update-status.ps1

## Notes

The tracker uses the npm registry API endpoint:
https://registry.npmjs.org/webrtcdevelopment
