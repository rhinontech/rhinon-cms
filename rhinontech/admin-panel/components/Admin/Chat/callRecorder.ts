/**
 * Records a call locally: every on-screen tile is drawn into one canvas (a
 * grid, or the screen share large), and all audio — mine and everyone else's —
 * is mixed through Web Audio. The file is saved to the recorder's device;
 * nothing is uploaded. Everyone in the call sees a "Recording" banner.
 */

export interface CallRecording {
  stop: () => Promise<Blob>;
  addAudio: (stream: MediaStream) => void;
}

function pickMimeType(): string {
  const options = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return options.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

export function recordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && "captureStream" in HTMLCanvasElement.prototype && !!pickMimeType();
}

export function startRecording(audioStreams: MediaStream[]): CallRecording {
  const W = 1280;
  const H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const audio = new AudioContext();
  const dest = audio.createMediaStreamDestination();
  const connected = new Set<string>();
  const addAudio = (stream: MediaStream) => {
    if (connected.has(stream.id) || !stream.getAudioTracks().length) return;
    connected.add(stream.id);
    audio.createMediaStreamSource(stream).connect(dest);
  };
  audioStreams.forEach(addAudio);

  let running = true;
  const draw = () => {
    if (!running) return;
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, W, H);
    // Tiles in the call window carry data attributes; the spotlight (a screen share) goes big.
    const tiles = Array.from(document.querySelectorAll<HTMLElement>("[data-call-tile]"));
    const spotlight = tiles.find((t) => t.dataset.spotlight === "true");
    const ordered = spotlight ? [spotlight] : tiles;
    const n = ordered.length || 1;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cw = W / cols;
    const ch = H / rows;
    ordered.forEach((tile, i) => {
      const x = (i % cols) * cw;
      const y = Math.floor(i / cols) * ch;
      const video = tile.querySelector("video");
      if (video && video.videoWidth && tile.dataset.hasVideo === "true") {
        const scale = Math.min(cw / video.videoWidth, ch / video.videoHeight);
        const vw = video.videoWidth * scale;
        const vh = video.videoHeight * scale;
        ctx.drawImage(video, x + (cw - vw) / 2, y + (ch - vh) / 2, vw, vh);
      } else {
        ctx.fillStyle = "#27272a";
        ctx.fillRect(x + 4, y + 4, cw - 8, ch - 8);
      }
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(x + 8, y + ch - 34, Math.min(cw - 16, 220), 26);
      ctx.fillStyle = "#fff";
      ctx.font = "15px system-ui, sans-serif";
      ctx.fillText(tile.dataset.name ?? "", x + 16, y + ch - 16, Math.min(cw - 32, 200));
    });
    setTimeout(draw, 1000 / 24);
  };
  draw();

  const stream = new MediaStream([...canvas.captureStream(24).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 2_500_000 } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start(1000);

  return {
    addAudio,
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          running = false;
          stream.getTracks().forEach((t) => t.stop());
          void audio.close();
          resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
        };
        recorder.stop();
      }),
  };
}

export function downloadRecording(blob: Blob, title: string) {
  const ext = blob.type.includes("mp4") ? "mp4" : "webm";
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\w-]+/g, "-").slice(0, 40) || "call"}-${stamp}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
