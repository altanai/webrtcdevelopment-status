# webrtcdevelopment-status

Status tracker for the npm package webrtcdevelopment.

This repository is pure WebRTC (native browser APIs) and is intended to replace the existing npm library behavior incrementally.
It does not require MoQ.

[![Update package status](https://github.com/altanai/webrtcdevelopment-status/actions/workflows/update-status.yml/badge.svg)](https://github.com/altanai/webrtcdevelopment-status/actions/workflows/update-status.yml)

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

A human-readable snapshot is stored in STATUS.md.

Source package: https://www.npmjs.com/package/webrtcdevelopment

## Auto updates

This repository includes a GitHub Actions workflow that runs every day and on manual trigger:

- Runs scripts/update-status.ps1
- Updates status.json and STATUS.md
- Commits and pushes changes if there is any diff

## Native Chrome WebRTC Support

This repository now includes a native browser implementation in src/webrtcdevelopment-native.js.

The API supports configuration fields aligned with webrtcdevelopment npm docs:

- local
- remote
- incoming
- outgoing
- session (including rtcConfiguration.iceServers)

It also includes optional `avtcore` extension hooks for codec preference and transport-tuning policies.

Example config file:

- config/webrtcdevelopment-config.example.json

Example browser page:

- examples/native-chrome-demo.html

AVTCORE extensibility notes:

- AVTCORE_EXTENSIBILITY.md

Main class usage:

```javascript
import { WebRTCDevelopmentNative } from "./src/webrtcdevelopment-native.js";

const rtc = new WebRTCDevelopmentNative(config, {
	onSignal: (payload) => {
		// Send payload through your signaling transport.
	}
});

await rtc.startCall();
```

## Local update command

From this repository root:

powershell -ExecutionPolicy Bypass -File ./scripts/update-status.ps1

## Notes

The tracker uses the npm registry API endpoint:
https://registry.npmjs.org/webrtcdevelopment
