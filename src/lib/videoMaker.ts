/**
 * 前端视频合成工具
 * 将多张图片合成一个带转场效果的短视频
 * 完全在浏览器端运行，零服务器成本
 */

export interface VideoFrame {
  /** 图片数据 URL */
  imageData: string;
  /** 显示时长（秒） */
  duration: number;
  /** 叠加文字（可选） */
  overlay?: string;
}

/**
 * 将多张图片合成为一个 WebM 视频 Blob
 */
export async function createSlideshowVideo(
  frames: VideoFrame[],
  onProgress?: (percent: number) => void
): Promise<Blob | null> {
  if (frames.length === 0) return null;

  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1920; // 9:16 竖屏
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const fps = 30;
  const chunks: Blob[] = [];

  // 使用支持 WebM 的 MIME 类型
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    let frameIndex = 0;
    let frameCount = 0;
    const totalFrames = frames.reduce((sum, f) => sum + f.duration * fps, 0);

    recorder.start();

    const drawFrame = () => {
      if (frameIndex >= frames.length) {
        recorder.stop();
        return;
      }

      const frame = frames[frameIndex];
      const elapsedInFrame = frameCount % (frame.duration * fps);
      const progressInFrame = elapsedInFrame / (frame.duration * fps);
      const isFirstFrameOfImage = elapsedInFrame === 0;

      // 清屏
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // 加载并绘制当前图片
      const img = new Image();
      img.onload = () => {
        // 计算缩放比例以填充画面
        const scale = Math.max(width / img.width, height / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const x = (width - scaledW) / 2;
        const y = (height - scaledH) / 2;

        // 透明度：淡入效果（前0.3秒）
        let alpha = 1;
        if (progressInFrame < 0.3 / frame.duration) {
          alpha = progressInFrame / (0.3 / frame.duration);
        }

        ctx.globalAlpha = alpha;
        ctx.drawImage(img, x, y, scaledW, scaledH);
        ctx.globalAlpha = 1;

        // 叠加文字（如果是最后一张完成照）
        if (frame.overlay) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, height - 160, width, 160);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(frame.overlay, width / 2, height - 80);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '28px Inter, system-ui, sans-serif';
          ctx.fillText('via InkFlow', width / 2, height - 40);
        }

        frameCount++;
        if (onProgress && frameCount % 10 === 0) {
          onProgress(Math.round((frameCount / totalFrames) * 100));
        }

        if (elapsedInFrame >= (frame.duration * fps) - 1) {
          frameIndex++;
          frameCount = 0;
        }

        requestAnimationFrame(drawFrame);
      };
      img.src = frame.imageData;
    };

    drawFrame();
  });
}

/**
 * 生成 Session 过程照视频
 */
export async function createSessionRecap(
  photos: string[],
  artistName: string,
  sessionType: string
): Promise<Blob | null> {
  if (photos.length === 0) return null;

  const frames: VideoFrame[] = photos.map((photo, i) => {
    const isLast = i === photos.length - 1;
    return {
      imageData: photo,
      duration: isLast ? 3.0 : 1.5, // 最后一张完成照停留3秒，其他1.5秒
      overlay: isLast ? `${artistName} · ${sessionType}` : undefined,
    };
  });

  return createSlideshowVideo(frames);
}
