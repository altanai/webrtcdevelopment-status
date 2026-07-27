# AVTCORE Extensibility Notes

This library is intentionally pure WebRTC (browser-native APIs) and does not require MoQ.

## Goal

Provide extension points to align with IETF AVTCORE evolution while preserving the existing webrtcdevelopment-style config model.

## Current extension hooks

The `avtcore` object in configuration supports:

- `preferredAudioCodecs`: codec mime types in priority order (for example `audio/opus`)
- `preferredVideoCodecs`: codec mime types in priority order (for example `video/VP9`, `video/H264`)
- `audioMaxBitrate`: max audio sender bitrate in bps
- `videoMaxBitrate`: max video sender bitrate in bps
- `degradationPreference`: WebRTC sender degradation preference
- `rtcpFeedbackProfiles`: metadata placeholder for AVTCORE-aligned feedback profiles
- `headerExtensions`: metadata placeholder for RTP header extension strategy

## Browser API behavior

- Codec ordering is applied through `RTCRtpTransceiver.setCodecPreferences` when supported.
- Sender bitrate and degradation preference are applied with `RTCRtpSender.setParameters`.
- `rtcpFeedbackProfiles` and `headerExtensions` are currently metadata hooks for app-level policy and future transport-specific integration.

## Why no MoQ here

This repository focuses on WebRTC call/session capabilities and compatibility with the npm `webrtcdevelopment` config shape.
Any future MoQ or non-WebRTC transport can be integrated in a separate adapter layer, not as a base requirement.
