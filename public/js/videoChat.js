const VideoChat = {
  activeRoom: null,
  localTracks: [],
  remoteParticipants: new Map(),

  async initialize(token, roomName) {
    try {
      // Initialize Twilio Video
      const Video = Twilio.Video;

      // Create local tracks
      this.localTracks = await Video.createLocalTracks({
        audio: true,
        video: { width: 640 },
      });

      // Connect to room
      this.activeRoom = await Video.connect(token, {
        name: roomName,
        tracks: this.localTracks,
        dominantSpeaker: true,
      });

      // Handle local participant
      this.handleLocalParticipant();

      // Handle existing participants
      this.activeRoom.participants.forEach(
        this.handleParticipantConnected.bind(this)
      );

      // Handle participant events
      this.activeRoom.on(
        "participantConnected",
        this.handleParticipantConnected.bind(this)
      );
      this.activeRoom.on(
        "participantDisconnected",
        this.handleParticipantDisconnected.bind(this)
      );
      this.activeRoom.on(
        "dominantSpeakerChanged",
        this.handleDominantSpeaker.bind(this)
      );

      // Set up disconnect handlers
      this.setupDisconnectHandlers();

      console.log("Successfully joined room:", roomName);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  },

  handleLocalParticipant() {
    const container = this.createParticipantContainer("You");
    container.classList.add("local-participant");

    this.localTracks.forEach((track) => {
      if (track.kind === "video") {
        const videoElement = track.attach();
        container.querySelector(".video-wrapper").prepend(videoElement);
      } else if (track.kind === "audio") {
        const audioElement = track.attach();
        audioElement.style.display = "none"; // Hide the audio element
        container.appendChild(audioElement);
      }
    });

    document.querySelector(".video-grid").appendChild(container);
  },

  createParticipantContainer(identity) {
    const container = document.createElement("div");
    container.className = "video-card";
    container.innerHTML = `
      <div class="video-wrapper">
        <div class="video-overlay">
          <div class="participant-info">
            <span class="participant-name">${identity}</span>
            <span class="connection-status">Connected</span>
          </div>
          ${
            identity === "You"
              ? `
            <div class="video-controls">
              <button class="control-btn audio-control" title="Mute">
                <i class="fas fa-microphone"></i>
              </button>
              <button class="control-btn video-control" title="Camera">
                <i class="fas fa-video"></i>
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    if (identity === "You") {
      this.setupLocalControls(container);
    }

    return container;
  },

  setupLocalControls(container) {
    const audioBtn = container.querySelector(".audio-control");
    const videoBtn = container.querySelector(".video-control");

    audioBtn.addEventListener("click", () => this.toggleAudio());
    videoBtn.addEventListener("click", () => this.toggleVideo());
  },

  handleParticipantConnected(participant) {
    console.log("Participant connected:", participant.identity);

    const container = this.createParticipantContainer(participant.identity);
    container.id = `participant-${participant.identity}`;
    document.querySelector(".video-grid").appendChild(container);

    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        this.handleTrackSubscribed(publication.track, participant);
      }
    });

    participant.on("trackSubscribed", (track) =>
      this.handleTrackSubscribed(track, participant)
    );
    participant.on("trackUnsubscribed", (track) =>
      this.handleTrackUnsubscribed(track, participant)
    );

    this.remoteParticipants.set(participant.identity, container);
  },

  handleTrackSubscribed(track, participant) {
    const container = document.getElementById(
      `participant-${participant.identity}`
    );
    if (!container) return;

    if (track.kind === "video") {
      const videoElement = track.attach();
      container.querySelector(".video-wrapper").prepend(videoElement);
    } else if (track.kind === "audio") {
      const audioElement = track.attach();
      audioElement.style.display = 'none';  // Hide the audio element
      container.appendChild(audioElement);
    }
  },

  handleTrackUnsubscribed(track) {
    track.detach().forEach((element) => element.remove());
  },

  handleParticipantDisconnected(participant) {
    console.log("Participant disconnected:", participant.identity);
    const container = document.getElementById(
      `participant-${participant.identity}`
    );
    if (container) {
      container.remove();
    }
    this.remoteParticipants.delete(participant.identity);
  },

  handleDominantSpeaker(participant) {
    // Remove highlight from previous dominant speaker
    document.querySelectorAll(".video-card").forEach((card) => {
      card.classList.remove("speaking");
    });

    // Add highlight to current dominant speaker
    if (participant) {
      const speakerContainer = document.getElementById(
        `participant-${participant.identity}`
      );
      if (speakerContainer) {
        speakerContainer.classList.add("speaking");
      }
    }
  },

  toggleAudio() {
    const audioTrack = this.localTracks.find((track) => track.kind === "audio");
    if (audioTrack) {
      if (audioTrack.isEnabled) {
        audioTrack.disable();
      } else {
        audioTrack.enable();
      }
      const icon = document.querySelector(".audio-control i");
      icon.className = audioTrack.isEnabled
        ? "fas fa-microphone"
        : "fas fa-microphone-slash";
    }
  },

  toggleVideo() {
    const videoTrack = this.localTracks.find((track) => track.kind === "video");
    if (videoTrack) {
      if (videoTrack.isEnabled) {
        videoTrack.disable();
      } else {
        videoTrack.enable();
      }
      const icon = document.querySelector(".video-control i");
      icon.className = videoTrack.isEnabled
        ? "fas fa-video"
        : "fas fa-video-slash";
    }
  },

  setupDisconnectHandlers() {
    window.addEventListener("beforeunload", this.cleanup.bind(this));
    document.querySelectorAll(".leave-room-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.cleanup();
        window.location.href = "/dashboard";
      });
    });
  },

  async cleanup() {
    if (this.activeRoom) {
      this.activeRoom.disconnect();
      this.activeRoom = null;
    }
    this.localTracks.forEach((track) => {
      track.stop();
      track.detach().forEach((element) => element.remove());
    });
    this.localTracks = [];
    this.remoteParticipants.clear();
  },
};

export default VideoChat;
