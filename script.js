const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const video = document.getElementById('main-video');
const upload = document.getElementById('upload');
const effectSelect = document.getElementById('effect-select');
const timeDisplay = document.getElementById('time-display');
const progressPointer = document.getElementById('progress-pointer');
const uploadLabel = document.getElementById('upload-label');
const playBtn = document.getElementById('play-pause');

// FFmpeg progress monitoring
ffmpeg.setProgress(({ ratio }) => {
    const percentage = Math.round(ratio * 100);
    document.getElementById('export-status').innerText = `Saqlanmoqda... ${percentage}%`;
    document.getElementById('export-progress-bar').style.width = percentage + "%";
});

// Video yuklash
upload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        video.src = URL.createObjectURL(file);
        uploadLabel.style.display = 'none';
        video.style.display = 'block';
    }
});

// Play/Pause boshqaruvi
playBtn.addEventListener('click', () => {
    if (video.paused) {
        video.play();
        playBtn.innerText = "⏸ Pause";
    } else {
        video.pause();
        playBtn.innerText = "▶ Play";
    }
});

// Effektni real vaqtda ko'rish
effectSelect.addEventListener('change', () => {
    video.style.filter = effectSelect.value;
});

// Timeline yangilanishi
video.addEventListener('timeupdate', () => {
    const progress = (video.currentTime / video.duration) * 100;
    progressPointer.style.left = progress + "%";
    
    let mins = Math.floor(video.currentTime / 60);
    let secs = Math.floor(video.currentTime % 60);
    timeDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// Haqiqiy SAVE (Export) funksiyasi
async function saveVideo() {
    if (!upload.files[0]) return alert("Avval video yuklang!");

    const overlay = document.getElementById('export-overlay');
    overlay.style.display = 'flex';

    try {
        if (!ffmpeg.isLoaded()) await ffmpeg.load();

        const file = upload.files[0];
        ffmpeg.FS('writeFile', 'input_file.mp4', await fetchFile(file));

        // Effektni tahlil qilish
        let filter = 'copy';
        const val = effectSelect.value;
        if (val.includes('grayscale')) filter = 'format=gray';
        else if (val.includes('sepia')) filter = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
        else if (val.includes('invert')) filter = 'negate';
        else if (val.includes('blur')) filter = 'boxblur=5:1';

        // FFmpeg buyrug'ini bajarish
        await ffmpeg.run('-i', 'input_file.mp4', '-vf', filter, '-preset', 'ultrafast', 'output_file.mp4');

        // Natijani o'qish va yuklab olish
        const data = ffmpeg.FS('readFile', 'output_file.mp4');
        const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'InShot_Video_' + Date.now() + '.mp4';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

    } catch (error) {
        console.error(error);
        alert("Xatolik yuz berdi. Brauzer xotirasi to'lgan bo'lishi mumkin.");
    } finally {
        overlay.style.display = 'none';
        document.getElementById('export-progress-bar').style.width = "0%";
    }
}

document.getElementById('download-btn').addEventListener('click', saveVideo);
