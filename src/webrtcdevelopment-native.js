/*
  Native browser WebRTC helper with config shape compatible with
  webrtcdevelopment docs: local, remote, incoming, outgoing, session.
*/

export class WebRTCDevelopmentNative {
  constructor(config, callbacks = {}) {
    this.config = normalizeConfig(config);
    this.callbacks = callbacks;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = new MediaStream();
    this.dataChannel = null;
  }

  async initLocalMedia() {
    const mediaConstraints = {
      audio: !!this.config.outgoing.audio,
      video: !!this.config.outgoing.video
    };

    if (!mediaConstraints.audio && !mediaConstraints.video) {
      this.localStream = new MediaStream();
      return this.localStream;
    }

    this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    this.attachStreamToElement(this.localStream, this.config.local.video);
    return this.localStream;
  }

  createPeerConnection() {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    this.peerConnection = new RTCPeerConnection(this.config.session.rtcConfiguration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callbacks.onSignal) {
        this.callbacks.onSignal({ type: "ice-candidate", candidate: event.candidate });
      }
    };

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });

      const remotePrimary = this.config.remote.videoarr[0];
      this.attachStreamToElement(this.remoteStream, remotePrimary);

      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.configureDataChannel();
    };

    return this.peerConnection;
  }

  async startCall() {
    await this.initLocalMedia();
    this.createPeerConnection();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    if (this.config.outgoing.data) {
      this.dataChannel = this.peerConnection.createDataChannel("webrtcdevelopment-data");
      this.configureDataChannel();
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    if (this.callbacks.onSignal) {
      this.callbacks.onSignal({ type: "offer", sdp: offer.sdp });
    }

    return offer;
  }

  async acceptOffer(offerSdp) {
    await this.initLocalMedia();
    this.createPeerConnection();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    await this.peerConnection.setRemoteDescription({ type: "offer", sdp: offerSdp });
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    if (this.callbacks.onSignal) {
      this.callbacks.onSignal({ type: "answer", sdp: answer.sdp });
    }

    return answer;
  }

  async applyAnswer(answerSdp) {
    ensurePc(this.peerConnection);
    await this.peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });
  }

  async addIceCandidate(candidate) {
    ensurePc(this.peerConnection);
    await this.peerConnection.addIceCandidate(candidate);
  }

  async startScreenShare() {
    if (!this.config.outgoing.screen) {
      throw new Error("Screen sharing is disabled in outgoing.screen");
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const videoTrack = displayStream.getVideoTracks()[0];

    if (!videoTrack) {
      throw new Error("No screen video track available");
    }

    const sender = this.peerConnection
      ? this.peerConnection.getSenders().find((s) => s.track && s.track.kind === "video")
      : null;

    if (sender) {
      await sender.replaceTrack(videoTrack);
    }

    this.attachStreamToElement(displayStream, this.config.local.video);
    return displayStream;
  }

  sendData(payload) {
    if (!this.config.outgoing.data) {
      throw new Error("Data channel is disabled in outgoing.data");
    }
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("Data channel is not open");
    }

    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    this.dataChannel.send(body);
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    this.remoteStream = new MediaStream();
  }

  configureDataChannel() {
    if (!this.dataChannel) {
      return;
    }

    this.dataChannel.onmessage = (event) => {
      if (this.callbacks.onData) {
        this.callbacks.onData(event.data);
      }
    };

    this.dataChannel.onopen = () => {
      if (this.callbacks.onDataOpen) {
        this.callbacks.onDataOpen();
      }
    };

    this.dataChannel.onclose = () => {
      if (this.callbacks.onDataClose) {
        this.callbacks.onDataClose();
      }
    };
  }

  attachStreamToElement(stream, elementId) {
    if (!elementId) {
      return;
    }

    const element = document.getElementById(elementId);
    if (!element || element.tagName.toLowerCase() !== "video") {
      return;
    }

    element.srcObject = stream;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = elementId === this.config.local.video;
  }
}

export function normalizeConfig(config) {
  if (!config) {
    throw new Error("Configuration object is required");
  }

  return {
    local: {
      video: config.local?.video || "localVideo",
      videoClass: config.local?.videoClass || "",
      videoContainer: config.local?.videoContainer || "localVideoContainer",
      userDisplay: !!config.local?.userDisplay,
      userMetaDisplay: !!config.local?.userMetaDisplay,
      userdetails: {
        username: config.local?.userdetails?.username || "anonymous",
        usercolor: config.local?.userdetails?.usercolor || "#DDECEF",
        useremail: config.local?.userdetails?.useremail || "",
        role: config.local?.userdetails?.role || "participant"
      }
    },
    remote: {
      videoarr: Array.isArray(config.remote?.videoarr) && config.remote.videoarr.length > 0
        ? config.remote.videoarr
        : ["remoteVideo"],
      videoClass: config.remote?.videoClass || "",
      maxAllowed: Number(config.remote?.maxAllowed || 6),
      videoContainer: config.remote?.videoContainer || "remoteVideoContainer",
      userDisplay: !!config.remote?.userDisplay,
      userMetaDisplay: !!config.remote?.userMetaDisplay,
      dynamicVideos: !!config.remote?.dynamicVideos
    },
    incoming: {
      audio: config.incoming?.audio !== false,
      video: config.incoming?.video !== false,
      data: config.incoming?.data !== false,
      screen: config.incoming?.screen !== false
    },
    outgoing: {
      audio: config.outgoing?.audio !== false,
      video: config.outgoing?.video !== false,
      data: config.outgoing?.data !== false,
      screen: config.outgoing?.screen !== false
    },
    session: {
      id: config.session?.id || null,
      rtcConfiguration: {
        iceServers: Array.isArray(config.session?.rtcConfiguration?.iceServers)
          ? config.session.rtcConfiguration.iceServers
          : []
      }
    }
  };
}

function ensurePc(peerConnection) {
  if (!peerConnection) {
    throw new Error("Peer connection is not initialized");
  }
}
