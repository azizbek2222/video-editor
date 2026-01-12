const { createFFmpeg, fetchFile } = FFmpeg;

// FFmpeg-ni xotira cheklovi bilan sozlash
const ffmpeg = createFFmpeg({ 
    log: true,
    mainName: 'main',
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const video = document.getElementById('main-video');
const upload = document.getElementById('upload');
const effectSelect = document.getElementById('effect-select');
const timeDisplay = document.getElementById('time-display');
const progressPointer = document.getElementById('progress-pointer');
const uploadLabel = document.getElementById('upload-label');
const playBtn = document.getElementById('play-pause');

// 1. Progress (Foiz) hisoblash
ffmpeg.setProgress(({ ratio }) => {
    const percentage = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    const statusText = document.getElementById('export-status');
    const progressBar = document.getElementById('export-progress-bar');
    
    if (statusText) statusText.innerText = `Saqlanmoqda: ${percentage}%`;
    if (progressBar) progressBar.style.width = percentage + "%";
});

// 2. Video yuklash
upload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        // Eski URL bo'lsa tozalash
        if (video.src) URL.revokeObjectURL(video.src);
        
        video.src = URL.createObjectURL(file);
        uploadLabel.style.display = 'none';
        video.style.display = 'block';
        video.load();
    }
});

// 3. Play/Pause
if (playBtn) {
    playBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playBtn.innerText = "⏸ Pause";
        } else {
            video.pause();
            playBtn.innerText = "▶ Play";
        }
    });
}

// 4. Timeline harakati
video.addEventListener('timeupdate', () => {
    const progress = (video.currentTime / video.duration) * 100;
    if (progressPointer) progressPointer.style.left = progress + "%";
    
    let mins = Math.floor(video.currentTime / 60);
    let secs = Math.floor(video.currentTime % 60);
    timeDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// 5. ASOSIY SAQLASH (EXPORT) FUNKSIYASI
async function saveVideo() {
    if (!upload.files[0]) return alert("Avval video yuklang!");

    const overlay = document.getElementById('export-overlay');
    if (overlay) overlay.style.display = 'flex';

    try {
        // FFmpeg yuklanmagan bo'lsa yuklash
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        const file = upload.files[0];
        const inputName = 'input.mp4';
        const outputName = 'output.mp4';

        // Videoni virtual xotiraga yozish
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));

        // Effektni aniqlash
        let filter = 'copy'; 
        const val = effectSelect.value;
        if (val.includes('grayscale')) filter = 'format=gray';
        else if (val.includes('sepia')) filter = 'sepia';
        else if (val.includes('invert')) filter = 'negate';
        else if (val.includes('blur')) filter = 'boxblur=5:1';

        // FFmpeg buyrug'i (Xotirani tejaydigan sozlamalar bilan)
        // -preset ultrafast: Tezroq ishlash uchun
        // -crf 28: Sifat va hajm muvozanati uchun
        await ffmpeg.run(
            '-i', inputName,
            '-vf', filter,
            '-preset', 'ultrafast',
            '-crf', '28',
            '-c:a', 'copy', 
            outputName
        );

        // Tayyor faylni o'qish
        const data = ffmpeg.FS('readFile', outputName);

        // Telefonga yuklab olish jarayoni
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `InShot_Web_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // XOTIRANI TOZALASH (Eng muhimi)
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
        alert("Xatolik: Video juda katta yoki telefon xotirasi yetmadi. Iltimos, kichikroq video (masalan, 10-20 soniyalik) bilan sinab ko'ring.");
    } finally {
        if (overlay) overlay.style.display = 'none';
        const progressBar = document.getElementById('export-progress-bar');
        if (progressBar) progressBar.style.width = "0%";
    }
}

document.getElementById('download-btn').addEventListener('click', saveVideo);
