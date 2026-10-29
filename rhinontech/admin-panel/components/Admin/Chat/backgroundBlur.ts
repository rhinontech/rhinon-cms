import type { ImageSegmenter } from "@mediapipe/tasks-vision";

/**
 * Background blur for call video: MediaPipe's selfie segmenter separates the
 * person from the background each frame, and a canvas composites a sharp person
 * over a blurred copy of the frame. The canvas's stream replaces the camera
 * track on every peer connection.
 *
 * Loaded lazily (the wasm + model are ~3 MB) the first time someone turns it on.
 */

const VERSION = "0.10.21";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

let segmenterPromise: Promise<ImageSegmenter> | null = null;

function loadSegmenter(): Promise<ImageSegmenter> {
  segmenterPromise ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    const create = (delegate: "GPU" | "CPU") =>
      ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    return create("GPU").catch(() => create("CPU"));
  })();
  segmenterPromise.catch(() => {
    segmenterPromise = null; // allow a retry after a failed download
  });
  return segmenterPromise;
}

export interface BlurPipeline {
  track: MediaStreamTrack;
  stop: () => void;
}

export async function createBlurredTrack(source: MediaStreamTrack): Promise<BlurPipeline> {
  const segmenter = await loadSegmenter();
  const { width = 640, height = 480 } = source.getSettings();

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = new MediaStream([source]);
  await video.play();

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d")!;
  const person = document.createElement("canvas");
  person.width = width;
  person.height = height;
  const pctx = person.getContext("2d")!;
  const maskCanvas = document.createElement("canvas");
  const mctx = maskCanvas.getContext("2d")!;

  let running = true;
  let lastTime = -1;

  const frame = () => {
    if (!running) return;
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      const result = segmenter.segmentForVideo(video, performance.now());
      const mask = result.confidenceMasks?.[0];
      if (mask) {
        const mw = mask.width;
        const mh = mask.height;
        const data = mask.getAsFloat32Array();
        if (maskCanvas.width !== mw || maskCanvas.height !== mh) {
          maskCanvas.width = mw;
          maskCanvas.height = mh;
        }
        const img = mctx.createImageData(mw, mh);
        for (let i = 0; i < data.length; i++) img.data[i * 4 + 3] = Math.round(data[i] * 255);
        mctx.putImageData(img, 0, 0);

        // Person: the mask (scaled, softened) as alpha, then the frame drawn into it.
        pctx.globalCompositeOperation = "copy";
        pctx.filter = "blur(2px)";
        pctx.drawImage(maskCanvas, 0, 0, width, height);
        pctx.filter = "none";
        pctx.globalCompositeOperation = "source-in";
        pctx.drawImage(video, 0, 0, width, height);

        // Background: the whole frame, blurred; person on top.
        ctx.globalCompositeOperation = "copy";
        ctx.filter = "blur(14px)";
        ctx.drawImage(video, 0, 0, width, height);
        ctx.filter = "none";
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(person, 0, 0);
      }
      result.close();
    }
    schedule();
  };

  // requestVideoFrameCallback runs once per camera frame and isn't paused in
  // background tabs the way requestAnimationFrame is.
  const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
  const schedule = () => {
    if (!running) return;
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(frame);
    else setTimeout(frame, 33);
  };
  schedule();

  const track = out.captureStream(30).getVideoTracks()[0];
  return {
    track,
    stop: () => {
      running = false;
      track.stop();
      video.srcObject = null;
    },
  };
}

export const blurSupported = () =>
  typeof document !== "undefined" && "captureStream" in HTMLCanvasElement.prototype && typeof WebAssembly !== "undefined";
